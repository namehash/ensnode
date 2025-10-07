import { parse as parseConnectionString } from "pg-connection-string";
import { ZodError, prettifyError, z } from "zod/v4";

import { ENSNamespaceIds } from "@ensnode/datasources";
import {
  type ChainId,
  PluginName,
  deserializeChainId,
  isHttpProtocol,
  isWebSocketProtocol,
  uniq,
} from "@ensnode/ensnode-sdk";
import { makeFullyPinnedLabelSetSchema } from "@ensnode/ensnode-sdk";
import {
  invariant_isSubgraphCompatibleRequirements,
  makeUrlSchema,
} from "@ensnode/ensnode-sdk/internal";

import { DEFAULT_SUBGRAPH_COMPAT } from "@/lib/lib-config";

import { EnvironmentDefaults, applyDefaults } from "@/config/environment-defaults";

import { derive_indexedChainIds } from "./derived-params";
import type { ENSIndexerConfig, ENSIndexerEnvironment, RpcConfig } from "./types";
import {
  invariant_globalBlockrange,
  invariant_requiredDatasources,
  invariant_rpcConfigsSpecifiedForIndexedChains,
  invariant_rpcConfigsSpecifiedForRootChain,
  invariant_rpcEndpointConfigIncludesAtLeastOneHTTPProtocolURL,
  invariant_rpcEndpointConfigIncludesAtMostOneWebSocketsProtocolURL,
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
  .transform((val) => val.split(","))
  .pipe(z.array(makeUrlSchema("RPC_URL_*")))
  .check(invariant_rpcEndpointConfigIncludesAtLeastOneHTTPProtocolURL)
  .check(invariant_rpcEndpointConfigIncludesAtMostOneWebSocketsProtocolURL);

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
  .transform((val) => val.split(","))
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

const EnsRainbowUrlSchema = makeUrlSchema("ENSRAINBOW_URL");

const LabelSetSchema = makeFullyPinnedLabelSetSchema("LABEL_SET");

const RpcConfigsSchema = z
  .record(z.string().transform(Number).pipe(chainIdSchema), RpcConfigSchema, {
    error: "Chains configuration must be an object mapping valid chain IDs to their configs.",
  })
  .transform((records) => {
    const rpcConfigs = new Map<ChainId, RpcConfig>();

    for (const [chainIdString, rpcConfig] of Object.entries(records)) {
      // rpcConfig is guaranteed to include at least one HTTP protocol URL
      const httpRPCs = rpcConfig.filter(isHttpProtocol) as [URL, ...URL[]];

      // rpcConfig is guaranteed to include at most one WebSocket protocol URL
      const websocketRPC = rpcConfig.find(isWebSocketProtocol);

      rpcConfigs.set(deserializeChainId(chainIdString), {
        httpRPCs,
        websocketRPC,
      });
    }

    return rpcConfigs;
  });

const DatabaseUrlSchema = z.string().refine(
  (url) => {
    try {
      if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
        return false;
      }
      const config = parseConnectionString(url);
      return !!(config.host && config.port && config.database);
    } catch {
      return false;
    }
  },
  {
    error:
      "Invalid PostgreSQL connection string. Expected format: postgresql://username:password@host:port/database",
  },
);

const IsSubgraphCompatibleSchema =
  makeEnvStringBoolSchema("SUBGRAPH_COMPAT").default(DEFAULT_SUBGRAPH_COMPAT);

const ENSIndexerConfigSchema = z
  .object({
    namespace: ENSNamespaceSchema,
    globalBlockrange: BlockrangeSchema,
    ensIndexerUrl: EnsIndexerUrlSchema,
    databaseSchemaName: PonderDatabaseSchemaSchema,
    plugins: PluginsSchema,
    ensRainbowUrl: EnsRainbowUrlSchema,
    labelSet: LabelSetSchema,
    rpcConfigs: RpcConfigsSchema,
    databaseUrl: DatabaseUrlSchema,
    isSubgraphCompatible: IsSubgraphCompatibleSchema,
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
  .check(invariant_isSubgraphCompatibleRequirements)
  /**
   * Derived configuration
   *
   * We create new configuration parameters from the values parsed with `ENSIndexerConfigSchema`.
   * This way, we can include complex configuration objects, for example, `datasources` that was
   * derived from `namespace` and relevant SDK helper method, and attach result value to
   * ENSIndexerConfig object. For example, we can get a slice of already parsed and validated
   * ENSIndexerConfig values, and return this slice PLUS the derived configuration properties.
   *
   * See {@link derive_indexedChainIds} for example.
   */
  .transform(derive_indexedChainIds)
  // `invariant_globalBlockrange` has dependency on `derive_indexedChainIds`
  .check(invariant_globalBlockrange);

/**
 * Builds the ENSIndexer configuration object from an ENSIndexerEnvironment object.
 *
 * First parses the SUBGRAPH_COMPAT environment variable to determine compatibility mode,
 * then applies appropriate environment defaults based on that mode (subgraphCompatible or alpha).
 * Finally validates and parses the complete environment configuration using ENSIndexerConfigSchema.
 *
 * @param environment - The environment variables object to build config from
 * @returns A validated ENSIndexerConfig object
 * @throws Error with formatted validation messages if environment parsing fails
 */
export function buildConfigFromEnvironment(environment: ENSIndexerEnvironment): ENSIndexerConfig {
  try {
    // first parse the SUBGRAPH_COMPAT env variable
    const subgraphCompat = IsSubgraphCompatibleSchema.parse(environment.isSubgraphCompatible);

    // based on indicated subgraph compatibility preference, provide sensible defaults for the config
    const environmentDefaults = subgraphCompat
      ? EnvironmentDefaults.subgraphCompatible
      : EnvironmentDefaults.alpha;

    // apply the partial defaults to the ENSIndexerEnvironment
    const environmentWithDefaults = applyDefaults(environment, environmentDefaults);

    // parse with ENSIndexerConfigSchema
    return ENSIndexerConfigSchema.parse(environmentWithDefaults);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(
        "Failed to parse environment configuration: \n" + prettifyError(error) + "\n",
      );
    }

    throw error;
  }
}
