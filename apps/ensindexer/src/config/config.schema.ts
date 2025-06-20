import { parse as parseConnectionString } from "pg-connection-string";
import { prettifyError, z } from "zod/v4";

import { derive_ensDeployment, derive_isSubgraphCompatible } from "@/config/derived-params";
import type { ENSIndexerConfig, ENSIndexerEnvironment } from "@/config/types";
import {
  invariant_globalBlockrange,
  invariant_requiredDatasources,
  invariant_rpcConfigsSpecifiedForIndexedChains,
  invariant_validContractConfigs,
} from "@/config/validations";
import {
  DEFAULT_ENSADMIN_URL,
  DEFAULT_HEAL_REVERSE_ADDRESSES,
  DEFAULT_INDEX_ADDITIONAL_RESOLVER_RECORDS,
  DEFAULT_L1_CHAIN,
  DEFAULT_PORT,
  DEFAULT_RPC_RATE_LIMIT,
} from "@/lib/lib-config";
import { uniq } from "@/lib/lib-helpers";
import { L1Chains } from "@ensnode/datasources";
import { PluginName } from "@ensnode/ensnode-sdk";

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

const makeUrlSchema = (envVarKey: string) =>
  z.url({
    error: `${envVarKey} must be a valid URL string (e.g., http://localhost:8080 or https://example.com).`,
  });

const makeBlockNumberSchema = (envVarKey: string) =>
  z.coerce
    .number({ error: `${envVarKey} must be a positive integer.` })
    .int({ error: `${envVarKey} must be a positive integer.` })
    .min(0, { error: `${envVarKey} must be a positive integer.` })
    .optional();

const RpcConfigSchema = z.object({
  url: makeUrlSchema("RPC_URL_*"),
  maxRequestsPerSecond: z.coerce
    .number({ error: "RPC_REQUEST_RATE_LIMIT_* must be an integer." })
    .int({ error: "RPC_REQUEST_RATE_LIMIT_* must be an integer." })
    .min(1, { error: "RPC_REQUEST_RATE_LIMIT_* must be at least 1." })
    .default(DEFAULT_RPC_RATE_LIMIT),
});

const L1ChainSchema = z
  .enum(L1Chains, {
    error: (issue) => {
      return `Invalid L1_CHAIN. Supported L1 Chains are: ${Object.keys(L1Chains).join(", ")}`;
    },
  })
  .default(DEFAULT_L1_CHAIN);

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
          error: `ACTIVE_PLUGINS must be a comma separated list with at least one valid plugin name. Valid plugins are: ${Object.values(
            PluginName,
          ).join(", ")}`,
        }),
      )
      .min(1, {
        error: `ACTIVE_PLUGINS must be a comma separated list with at least one valid plugin name. Valid plugins are: ${Object.values(
          PluginName,
        ).join(", ")}`,
      }),
  )
  .refine((arr) => arr.length === uniq(arr).length, {
    error: "ACTIVE_PLUGINS cannot contain duplicate values",
  });

const HealReverseAddressesSchema = makeEnvStringBoolSchema("HEAL_REVERSE_ADDRESSES") //
  .default(DEFAULT_HEAL_REVERSE_ADDRESSES);

const indexAdditionalResolverRecordsSchema = makeEnvStringBoolSchema(
  "INDEX_ADDITIONAL_RESOLVER_RECORDS",
).default(DEFAULT_INDEX_ADDITIONAL_RESOLVER_RECORDS);

const PortSchema = z.coerce
  .number({ error: "PORT must be an integer." })
  .int({ error: "PORT must be an integer." })
  .min(1, { error: "PORT must be an integer between 1 and 65535." })
  .max(65535, { error: "PORT must be an integer between 1 and 65535." })
  .default(DEFAULT_PORT);

const EnsRainbowEndpointUrlSchema = makeUrlSchema("ENSRAINBOW_URL");

const RpcConfigsSchema = z.record(
  z.string().transform(Number).pipe(chainIdSchema),
  RpcConfigSchema,
  {
    error: "Chains configuration must be an object mapping valid chain IDs to their configs.",
  },
);

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
    l1Chain: L1ChainSchema,
    globalBlockrange: BlockrangeSchema,
    ensNodePublicUrl: EnsNodePublicUrlSchema,
    ensAdminUrl: EnsAdminUrlSchema,
    ponderDatabaseSchema: PonderDatabaseSchemaSchema,
    plugins: PluginsSchema,
    healReverseAddresses: HealReverseAddressesSchema,
    indexAdditionalResolverRecords: indexAdditionalResolverRecordsSchema,
    port: PortSchema,
    ensRainbowEndpointUrl: EnsRainbowEndpointUrlSchema,
    rpcConfigs: RpcConfigsSchema,
    databaseUrl: DatabaseUrlSchema,
  })
  /**
   * Invariant enforcement
   *
   * We enforce invariants across multiple values parsed with `ENSIndexerConfigSchema`
   * by calling `.check()` function with relevant invariant-enforcing logic.
   * Each such function has access to config values that were already parsed.
   * If you need to ensure certain config value permutation, say across `l1Chain`
   * and `plugins` values, you can define the `.check()` function callback with the following
   * input param:
   *
   * ```ts
   * ctx: ZodCheckFnInput<Pick<ENSIndexerConfig, "l1Chain" | "plugins">>
   * ```
   *
   * This way, the invariant logic can access all information it needs, while keeping room
   * for the derived values of ENSIndexerConfig to be computed after all `.check()`s.
   */
  .check(invariant_requiredDatasources)
  .check(invariant_rpcConfigsSpecifiedForIndexedChains)
  .check(invariant_globalBlockrange)
  .check(invariant_validContractConfigs)
  /**
   * Derived configuration
   *
   * We create new configuration parameters from the values parsed with `ENSIndexerConfigSchema`.
   * This way, we can include complex configuration objects, for example, `ensDeployment` that was
   * derived from `l1Chain` and relevant SDK helper method, and attach result value to
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
  .transform(derive_ensDeployment)
  .transform(derive_isSubgraphCompatible);

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
