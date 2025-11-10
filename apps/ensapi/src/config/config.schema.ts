import packageJson from "@/../package.json" with { type: "json" };

import { getUnixTime } from "date-fns";
import pRetry from "p-retry";
import { parse as parseConnectionString } from "pg-connection-string";
import { prettifyError, ZodError, z } from "zod/v4";

import { type ENSApiPublicConfig, serializeENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";
import {
  buildRpcConfigsFromEnv,
  DatabaseSchemaNameSchema,
  ENSNamespaceSchema,
  EnsIndexerUrlSchema,
  invariant_rpcConfigsSpecifiedForRootChain,
  makeENSIndexerPublicConfigSchema,
  makeUnixTimestampSchema,
  PortSchema,
  RpcConfigsSchema,
  TheGraphApiKeySchema,
} from "@ensnode/ensnode-sdk/internal";

import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import type { EnsApiEnvironment } from "@/config/environment";
import { invariant_ensIndexerPublicConfigVersionInfo } from "@/config/validations";
import { fetchENSIndexerConfig } from "@/lib/fetch-ensindexer-config";
import logger from "@/lib/logger";
import { canFallbackToTheGraph } from "@/lib/thegraph";

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

const DateStringToUnixTimestampSchema = z
  .string()
  .refine(
    (dateStr) => {
      try {
        const date = new Date(dateStr);
        return !Number.isNaN(date.getTime());
      } catch {
        return false;
      }
    },
    {
      error: "Invalid date string. Expected a valid date format (e.g., 'Dec 1, 2025 00:00:00 UTC')",
    },
  )
  .transform((dateStr) => {
    const timestamp = getUnixTime(new Date(dateStr));
    return makeUnixTimestampSchema().parse(timestamp);
  });

const EnsApiConfigSchema = z
  .object({
    port: PortSchema.default(ENSApi_DEFAULT_PORT),
    databaseUrl: DatabaseUrlSchema,
    databaseSchemaName: DatabaseSchemaNameSchema,
    ensIndexerUrl: EnsIndexerUrlSchema,
    theGraphApiKey: TheGraphApiKeySchema,
    namespace: ENSNamespaceSchema,
    rpcConfigs: RpcConfigsSchema,
    ensIndexerPublicConfig: makeENSIndexerPublicConfigSchema("ensIndexerPublicConfig"),
    ensAwardsStart: DateStringToUnixTimestampSchema.default(() =>
      getUnixTime(new Date("Dec 1, 2025 00:00:00 UTC")),
    ),
    ensAwardsEnd: DateStringToUnixTimestampSchema.default(() =>
      getUnixTime(new Date("Dec 31, 2025 23:59:59 UTC")),
    ),
  })
  .check(invariant_rpcConfigsSpecifiedForRootChain)
  .check(invariant_ensIndexerPublicConfigVersionInfo);

export type EnsApiConfig = z.infer<typeof EnsApiConfigSchema>;

/**
 * Builds the EnsApiConfig from an EnsApiEnvironment object, fetching the EnsIndexerPublicConfig.
 *
 * @returns A validated EnsApiConfig object
 * @throws Error with formatted validation messages if environment parsing fails
 */
export async function buildConfigFromEnvironment(env: EnsApiEnvironment): Promise<EnsApiConfig> {
  try {
    const ensIndexerUrl = EnsIndexerUrlSchema.parse(env.ENSINDEXER_URL);

    const ensIndexerPublicConfig = await pRetry(() => fetchENSIndexerConfig(ensIndexerUrl), {
      retries: 3,
      onFailedAttempt: ({ error, attemptNumber, retriesLeft }) => {
        logger.info(
          `ENSIndexer Config fetch attempt ${attemptNumber} failed (${error.message}). ${retriesLeft} retries left.`,
        );
      },
    });

    const rpcConfigs = buildRpcConfigsFromEnv(env, ensIndexerPublicConfig.namespace);

    return EnsApiConfigSchema.parse({
      port: env.PORT,
      databaseUrl: env.DATABASE_URL,
      ensIndexerUrl: env.ENSINDEXER_URL,
      theGraphApiKey: env.THEGRAPH_API_KEY,

      ensIndexerPublicConfig: serializeENSIndexerPublicConfig(ensIndexerPublicConfig),
      namespace: ensIndexerPublicConfig.namespace,
      databaseSchemaName: ensIndexerPublicConfig.databaseSchemaName,
      rpcConfigs,
      ensAwardsStart: env.ENSAWARDS_START,
      ensAwardsEnd: env.ENSAWARDS_END,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Failed to parse environment configuration: \n${prettifyError(error)}\n`);
      process.exit(1);
    }

    if (error instanceof Error) {
      logger.error(error, `Failed to build EnsApiConfig`);
      process.exit(1);
    }

    logger.error(`Unknown Error`);
    process.exit(1);
  }
}

/**
 * Builds the ENSApi public configuration from an EnsApiConfig object.
 *
 * @param config - The validated EnsApiConfig object
 * @returns A complete ENSApiPublicConfig object
 */
export function buildEnsApiPublicConfig(config: EnsApiConfig): ENSApiPublicConfig {
  return {
    version: packageJson.version,
    theGraphFallback: canFallbackToTheGraph(config),
    ensIndexerPublicConfig: config.ensIndexerPublicConfig,
  };
}
