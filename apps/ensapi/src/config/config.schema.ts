import packageJson from "@/../package.json" with { type: "json" };

import {
  ENS_HOLIDAY_AWARDS_END_DATE,
  ENS_HOLIDAY_AWARDS_START_DATE,
} from "@namehash/ens-referrals";
import { getUnixTime } from "date-fns";
import pRetry from "p-retry";
import { parse as parseConnectionString } from "pg-connection-string";
import { prettifyError, ZodError, z } from "zod/v4";

import { type ENSApiPublicConfig, serializeENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";
import {
  buildRpcConfigsFromEnv,
  canFallbackToTheGraph,
  DatabaseSchemaNameSchema,
  ENSNamespaceSchema,
  EnsIndexerUrlSchema,
  invariant_rpcConfigsSpecifiedForRootChain,
  makeDatetimeSchema,
  makeENSIndexerPublicConfigSchema,
  PortSchema,
  RpcConfigsSchema,
  TheGraphApiKeySchema,
} from "@ensnode/ensnode-sdk/internal";

import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import type { EnsApiEnvironment } from "@/config/environment";
import {
  invariant_ensHolidayAwardsEndAfterStart,
  invariant_ensIndexerPublicConfigVersionInfo,
} from "@/config/validations";
import { fetchENSIndexerConfig } from "@/lib/fetch-ensindexer-config";
import logger from "@/lib/logger";

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

// Use ISO 8601 format for defining datetime values (e.g., '2025-12-01T00:00:00Z')
const DateStringToUnixTimestampSchema = z.coerce
  .string()
  .pipe(makeDatetimeSchema())
  .transform((date) => getUnixTime(date));

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
    ensHolidayAwardsStart: DateStringToUnixTimestampSchema.default(ENS_HOLIDAY_AWARDS_START_DATE),
    ensHolidayAwardsEnd: DateStringToUnixTimestampSchema.default(ENS_HOLIDAY_AWARDS_END_DATE),
  })
  .check(invariant_rpcConfigsSpecifiedForRootChain)
  .check(invariant_ensIndexerPublicConfigVersionInfo)
  .check(invariant_ensHolidayAwardsEndAfterStart);

export type EnsApiConfig = z.infer<typeof EnsApiConfigSchema>;

/** Convert unix timestamp to ISO 8601 string for schema parsing */
function unixTimestampToISOString(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

function buildConfigForOpenApiGeneration(env: EnsApiEnvironment): EnsApiConfig {
  logger.info("OPENAPI_GENERATE_MODE enabled - using minimal mock config");

  return EnsApiConfigSchema.parse({
    port: env.PORT || ENSApi_DEFAULT_PORT,
    databaseUrl:
      "postgresql://mock_openapi_only:mock_openapi_only@localhost:5432/mock_openapi_only",
    databaseSchemaName: "public",
    ensIndexerUrl: "http://localhost:42069",
    theGraphApiKey: undefined,
    namespace: "mainnet",
    rpcConfigs: {
      "1": "https://rpc.example.com",
    },
    ensIndexerPublicConfig: {
      labelSet: {
        labelSetId: "ens-default",
        labelSetVersion: 1,
      },
      indexedChainIds: [1],
      isSubgraphCompatible: false,
      namespace: "mainnet",
      plugins: ["subgraph"],
      databaseSchemaName: "public",
      versionInfo: {
        nodejs: process.version,
        ponder: "0.0.0",
        ensDb: packageJson.version,
        ensIndexer: packageJson.version,
        ensNormalize: "0.0.0",
        ensRainbow: packageJson.version,
        ensRainbowSchema: 1,
      },
    },
    // Convert unix timestamps to ISO strings for schema parsing
    ensHolidayAwardsStart: unixTimestampToISOString(ENS_HOLIDAY_AWARDS_START_DATE),
    ensHolidayAwardsEnd: unixTimestampToISOString(ENS_HOLIDAY_AWARDS_END_DATE),
  });
}

/**
 * Builds the EnsApiConfig from an EnsApiEnvironment object, fetching the EnsIndexerPublicConfig.
 *
 * @returns A validated EnsApiConfig object
 * @throws Error with formatted validation messages if environment parsing fails
 */
export async function buildConfigFromEnvironment(env: EnsApiEnvironment): Promise<EnsApiConfig> {
  if (env.OPENAPI_GENERATE_MODE === "true") {
    return buildConfigForOpenApiGeneration(env);
  }

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
      ensHolidayAwardsStart: env.ENS_HOLIDAY_AWARDS_START,
      ensHolidayAwardsEnd: env.ENS_HOLIDAY_AWARDS_END,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Failed to parse environment configuration: \n${prettifyError(error)}\n`);
    } else if (error instanceof Error) {
      logger.error(error, `Failed to build EnsApiConfig`);
    } else {
      logger.error(`Unknown Error`);
    }

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
    theGraphFallback: canFallbackToTheGraph({
      namespace: config.namespace,
      // NOTE: very important here that we replace the actual server-side api key with a placeholder
      // so that it's not sent to clients as part of the `theGraphFallback.url`. The placeholder must
      // pass validation, of course, but the only validation necessary is that it is a string.
      theGraphApiKey: config.theGraphApiKey ? "<API_KEY>" : undefined,
      isSubgraphCompatible: config.ensIndexerPublicConfig.isSubgraphCompatible,
    }),
    ensIndexerPublicConfig: config.ensIndexerPublicConfig,
  };
}
