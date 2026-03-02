import { parse as parseConnectionString } from "pg-connection-string";
import { prettifyError, ZodError, z } from "zod/v4";

import { buildBlockNumberRange, PluginName, uniq } from "@ensnode/ensnode-sdk";
import {
  buildRpcConfigsFromEnv,
  DatabaseSchemaNameSchema,
  ENSNamespaceSchema,
  EnsIndexerUrlSchema,
  invariant_isSubgraphCompatibleRequirements,
  invariant_rpcConfigsSpecifiedForRootChain,
  makeFullyPinnedLabelSetSchema,
  makeUrlSchema,
  RpcConfigsSchema,
} from "@ensnode/ensnode-sdk/internal";

import { DEFAULT_SUBGRAPH_COMPAT } from "@/config/defaults";
import type { ENSIndexerEnvironment } from "@/config/environment";
import { applyDefaults, EnvironmentDefaults } from "@/config/environment-defaults";

import { derive_indexedChainIds } from "./derived-params";
import type { ENSIndexerConfig } from "./types";
import {
  invariant_globalBlockrange,
  invariant_requiredDatasources,
  invariant_rpcConfigsSpecifiedForIndexedChains,
  invariant_validContractConfigs,
} from "./validations";

export const DatabaseUrlSchema = z.string().refine(
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

const BlockrangeSchema = z
  .object({
    startBlock: makeBlockNumberSchema("START_BLOCK"),
    endBlock: makeBlockNumberSchema("END_BLOCK"),
  })
  .refine(
    (val) =>
      val.startBlock === undefined || val.endBlock === undefined || val.startBlock <= val.endBlock,
    { error: "START_BLOCK must be less than or equal to END_BLOCK." },
  )
  .transform(({ startBlock, endBlock }) => buildBlockNumberRange(startBlock, endBlock));

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

const IsSubgraphCompatibleSchema =
  makeEnvStringBoolSchema("SUBGRAPH_COMPAT").default(DEFAULT_SUBGRAPH_COMPAT);

const ENSIndexerConfigSchema = z
  .object({
    databaseUrl: DatabaseUrlSchema,
    databaseSchemaName: DatabaseSchemaNameSchema,
    rpcConfigs: RpcConfigsSchema,
    ensIndexerUrl: EnsIndexerUrlSchema,

    namespace: ENSNamespaceSchema,
    plugins: PluginsSchema,
    isSubgraphCompatible: IsSubgraphCompatibleSchema,
    globalBlockrange: BlockrangeSchema,
    ensRainbowUrl: EnsRainbowUrlSchema,
    labelSet: LabelSetSchema,
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
 *
 * Next, construct rpcConfigs based on availability of RPC provider API keys or specific RPC_URL_*
 * environment variables.
 *
 * Finally validates and parses the complete environment configuration using ENSIndexerConfigSchema.
 *
 * @returns A validated ENSIndexerConfig object
 * @throws Error with formatted validation messages if environment parsing fails
 */
export function buildConfigFromEnvironment(_env: ENSIndexerEnvironment): ENSIndexerConfig {
  try {
    // first parse the SUBGRAPH_COMPAT and NAMESPACE env variables
    const isSubgraphCompatible = IsSubgraphCompatibleSchema.parse(_env.SUBGRAPH_COMPAT);

    // based on indicated subgraph compatibility preference, provide sensible defaults for the config
    const environmentDefaults = isSubgraphCompatible
      ? EnvironmentDefaults.subgraphCompatible
      : EnvironmentDefaults.alpha;

    // apply the partial defaults to the provided env
    const env = applyDefaults(_env, environmentDefaults);

    // and use that to generate rpcConfigs
    const namespace = ENSNamespaceSchema.parse(env.NAMESPACE);
    const rpcConfigs = buildRpcConfigsFromEnv(env, namespace);

    // parse/validate with ENSIndexerConfigSchema
    return ENSIndexerConfigSchema.parse({
      databaseUrl: env.DATABASE_URL,
      databaseSchemaName: env.DATABASE_SCHEMA,
      ensIndexerUrl: env.ENSINDEXER_URL,
      namespace: env.NAMESPACE,
      rpcConfigs,

      plugins: env.PLUGINS,
      isSubgraphCompatible: env.SUBGRAPH_COMPAT,
      globalBlockrange: {
        startBlock: env.START_BLOCK,
        endBlock: env.END_BLOCK,
      },
      ensRainbowUrl: env.ENSRAINBOW_URL,
      labelSet: {
        labelSetId: env.LABEL_SET_ID,
        labelSetVersion: env.LABEL_SET_VERSION,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Failed to parse environment configuration: \n${prettifyError(error)}\n`);
    }

    throw error;
  }
}
