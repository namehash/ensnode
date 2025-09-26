import { parse as parseConnectionString } from "pg-connection-string";
import { prettifyError, z } from "zod/v4";

import { ENSNamespaceIds } from "@ensnode/datasources";
import {
  type ChainId,
  PluginName,
  deserializeChainId,
  isHttpEndpointURL,
  isWebSocketsEndpointURL,
  uniq,
} from "@ensnode/ensnode-sdk";
import { makeFullyPinnedLabelSetSchema } from "@ensnode/ensnode-sdk";
import { makeUrlSchema } from "@ensnode/ensnode-sdk/internal";

import {
  DEFAULT_ENSADMIN_URL,
  DEFAULT_HEAL_REVERSE_ADDRESSES,
  DEFAULT_INDEX_ADDITIONAL_RESOLVER_RECORDS,
  DEFAULT_PORT,
  DEFAULT_REPLACE_UNNORMALIZED,
} from "@/lib/lib-config";

import { derive_indexedChainIds, derive_isSubgraphCompatible } from "./derived-params";
import type { ENSIndexerConfig, ENSIndexerEnvironment, RpcConfig } from "./types";
import {
  invariant_globalBlockrange,
  invariant_requiredDatasources,
  invariant_reverseResolversPluginNeedsResolverRecords,
  invariant_rpcConfigsSpecifiedForIndexedChains,
  invariant_rpcConfigsSpecifiedForRootChain,
  invariant_rpcEndpointConfigIncludesAtLeastOneHTTPEndpointURL,
  invariant_rpcEndpointConfigIncludesAtMostOneWebSocketsEndpointURL,
  invariant_validContractConfigs,
} from "./validations";

const chainIdSchema = z.number().int().min(1);

// parses an env string bool with strict requirement of 'true' or 'false'
const makeEnvStringBoolSchema = (envVarKey: string) =>
  z
    .string()
    .pipe(
      z.enum(["true", "false"], {
        error: `${envVarKey} must be 'true' or 'false'.`,
      }),
    )
    .transform((val) => val === "true");

const makeBlockNumberSchema = (envVarKey: string) =>
  z.coerce
    .number({ error: `${envVarKey} must be a positive integer.` })
    .int({ error: `${envVarKey} must be a positive integer.` })
    .min(0, { error: `${envVarKey} must be a positive integer.` })
    .optional();

const RpcConfigSchema = z
  .string()
  .transform((val) => {
    return val.split(",").filter(Boolean);
  })
  .pipe(z.array(makeUrlSchema("RPC_URL_*")))
  .check(invariant_rpcEndpointConfigIncludesAtLeastOneHTTPEndpointURL)
  .check(invariant_rpcEndpointConfigIncludesAtMostOneWebSocketsEndpointURL);

const ENSNamespaceSchema = z.enum(ENSNamespaceIds, {
  error: (issue) => {
    return `Invalid NAMESPACE. Supported ENS namespaces are: ${Object.keys(ENSNamespaceIds).join(", ")}`;
  },
});

const BlockrangeSchema = z
  .object({
    startBlock: makeBlockNumberSchema("START_BLOCK"),
    endBlock: makeBlockNumberSchema("END_BLOCK"),
  })
  .refine(
    (val) =>
      val.startBlock === undefined || val.endBlock === undefined || val.endBlock > val.startBlock,
    { error: "END_BLOCK must be greater than START_BLOCK." },
  );

const EnsNodePublicUrlSchema = makeUrlSchema("ENSNODE_PUBLIC_URL");
const EnsAdminUrlSchema = makeUrlSchema("ENSADMIN_URL").default(DEFAULT_ENSADMIN_URL);
const EnsIndexerUrlSchema = makeUrlSchema("ENSINDEXER_URL");

const PonderDatabaseSchemaSchema = z
  .string({
    error: "DATABASE_SCHEMA is required.",
  })
  .trim()
  .min(1, {
    error: "DATABASE_SCHEMA is required and cannot be an empty string.",
  });

const PluginsSchema = z.coerce
  .string()
  .transform((val) => val.split(",").filter(Boolean))
  .pipe(
    z
      .array(
        z.enum(PluginName, {
          error: `PLUGINS must be a comma separated list with at least one valid plugin name. Valid plugins are: ${Object.values(
            PluginName,
          ).join(", ")}`,
        }),
      )
      .min(1, {
        error: `PLUGINS must be a comma separated list with at least one valid plugin name. Valid plugins are: ${Object.values(
          PluginName,
        ).join(", ")}`,
      }),
  )
  .refine((arr) => arr.length === uniq(arr).length, {
    error: "PLUGINS cannot contain duplicate values",
  });

const HealReverseAddressesSchema = makeEnvStringBoolSchema("HEAL_REVERSE_ADDRESSES") //
  .default(DEFAULT_HEAL_REVERSE_ADDRESSES);

const IndexAdditionalResolverRecordsSchema = makeEnvStringBoolSchema(
  "INDEX_ADDITIONAL_RESOLVER_RECORDS",
).default(DEFAULT_INDEX_ADDITIONAL_RESOLVER_RECORDS);

const ReplaceUnnormalizedSchema = makeEnvStringBoolSchema("REPLACE_UNNORMALIZED") //
  .default(DEFAULT_REPLACE_UNNORMALIZED);

const PortSchema = z.coerce
  .number({ error: "PORT must be an integer." })
  .int({ error: "PORT must be an integer." })
  .min(1, { error: "PORT must be an integer between 1 and 65535." })
  .max(65535, { error: "PORT must be an integer between 1 and 65535." })
  .default(DEFAULT_PORT);

const EnsRainbowUrlSchema = makeUrlSchema("ENSRAINBOW_URL");

const LabelSetSchema = makeFullyPinnedLabelSetSchema("LABEL_SET");

const RpcConfigsSchema = z
  .record(z.string().transform(Number).pipe(chainIdSchema), RpcConfigSchema, {
    error: "Chains configuration must be an object mapping valid chain IDs to their configs.",
  })
  .transform((records) => {
    const rpcConfigs = new Map<ChainId, RpcConfig>();

    for (const [chianIdString, rpcConfig] of Object.entries(records)) {
      rpcConfigs.set(deserializeChainId(chianIdString), {
        httpUrls: new Set(rpcConfig.filter(isHttpEndpointURL)),
        webSocketUrl: rpcConfig.find(isWebSocketsEndpointURL),
      });
    }

    return rpcConfigs;
  });

const DatabaseUrlSchema = z.union(
  [
    z.string().refine((url) => {
      try {
        if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
          return false;
        }
        const config = parseConnectionString(url);
        return !!(config.host && config.port && config.database);
      } catch {
        return false;
      }
    }),
    z.undefined(),
  ],
  {
    message:
      "Invalid PostgreSQL connection string. Expected format: postgresql://username:password@host:port/database",
  },
);

const ENSIndexerConfigSchema = z
  .object({
    namespace: ENSNamespaceSchema,
    globalBlockrange: BlockrangeSchema,
    ensNodePublicUrl: EnsNodePublicUrlSchema,
    ensIndexerUrl: EnsIndexerUrlSchema,
    ensAdminUrl: EnsAdminUrlSchema,
    databaseSchemaName: PonderDatabaseSchemaSchema,
    plugins: PluginsSchema,
    healReverseAddresses: HealReverseAddressesSchema,
    indexAdditionalResolverRecords: IndexAdditionalResolverRecordsSchema,
    replaceUnnormalized: ReplaceUnnormalizedSchema,
    port: PortSchema,
    ensRainbowUrl: EnsRainbowUrlSchema,
    labelSet: LabelSetSchema,
    rpcConfigs: RpcConfigsSchema,
    databaseUrl: DatabaseUrlSchema,
  })
  /**
   * Invariant enforcement
   *
   * We enforce invariants across multiple values parsed with `ENSIndexerConfigSchema`
   * by calling `.check()` function with relevant invariant-enforcing logic.
   * Each such function has access to config values that were already parsed.
   * If you need to ensure certain config value permutation, say across `namespace`
   * and `plugins` values, you can define the `.check()` function callback with the following
   * input param:
   *
   * ```ts
   * ctx: ZodCheckFnInput<Pick<ENSIndexerConfig, "namespace" | "plugins">>
   * ```
   *
   * This way, the invariant logic can access all information it needs, while keeping room
   * for the derived values of ENSIndexerConfig to be computed after all `.check()`s.
   */
  .check(invariant_requiredDatasources)
  .check(invariant_rpcConfigsSpecifiedForRootChain)
  .check(invariant_rpcConfigsSpecifiedForIndexedChains)
  .check(invariant_validContractConfigs)
  .check(invariant_reverseResolversPluginNeedsResolverRecords)
  /**
   * Derived configuration
   *
   * We create new configuration parameters from the values parsed with `ENSIndexerConfigSchema`.
   * This way, we can include complex configuration objects, for example, `datasources` that was
   * derived from `namespace` and relevant SDK helper method, and attach result value to
   * ENSIndexerConfig object. For example, we can get a slice of already parsed and validated
   * ENSIndexerConfig values, and return this slice PLUS the derived configuration properties.
   *
   * ```ts
   * function derive_isSubgraphCompatible<
   *   CONFIG extends Pick<
   *     ENSIndexerConfig,
   *     "plugins" | "healReverseAddresses" | "indexAdditionalResolverRecords"
   *   >,
   *  >(config: CONFIG): CONFIG & { isSubgraphCompatible: boolean } {
   *   return {
   *     ...config,
   *     isSubgraphCompatible: true // can use some complex logic to calculate the final outcome
   *   }
   * }
   * ```
   */
  .transform(derive_isSubgraphCompatible)
  .transform(derive_indexedChainIds)
  // `invariant_globalBlockrange` has dependency on `derive_indexedChainIds`
  .check(invariant_globalBlockrange);

/**
 * Builds the ENSIndexer configuration object from an ENSIndexerEnvironment object
 *
 * This function then validates the config against the zod schema ensuring that the config
 * meets all type checks and invariants.
 */
export function buildConfigFromEnvironment(environment: ENSIndexerEnvironment): ENSIndexerConfig {
  const parsed = ENSIndexerConfigSchema.safeParse(environment);

  if (!parsed.success) {
    throw new Error(
      "Failed to parse environment configuration: \n" + prettifyError(parsed.error) + "\n",
    );
  }

  return parsed.data;
}
