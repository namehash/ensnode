import packageJson from "@/../package.json" with { type: "json" };

import {
  getReferralProgramCycleSet,
  type ReferralProgramCycle,
  type ReferralProgramCycleSet,
} from "@namehash/ens-referrals/v1";
import {
  makeCustomReferralProgramCyclesSchema,
  makeReferralProgramCycleSetSchema,
} from "@namehash/ens-referrals/v1/internal";
import pRetry from "p-retry";
import { parse as parseConnectionString } from "pg-connection-string";
import { prettifyError, ZodError, z } from "zod/v4";

import {
  type ENSApiPublicConfig,
  type ENSNamespaceId,
  getEthnamesSubregistryId,
  serializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";
import {
  buildRpcConfigsFromEnv,
  canFallbackToTheGraph,
  DatabaseSchemaNameSchema,
  ENSNamespaceSchema,
  EnsIndexerUrlSchema,
  invariant_rpcConfigsSpecifiedForRootChain,
  makeENSIndexerPublicConfigSchema,
  PortSchema,
  RpcConfigsSchema,
  TheGraphApiKeySchema,
} from "@ensnode/ensnode-sdk/internal";

import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import type { EnsApiEnvironment } from "@/config/environment";
import { invariant_ensIndexerPublicConfigVersionInfo } from "@/config/validations";
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
    referralProgramCycleSet: makeReferralProgramCycleSetSchema("referralProgramCycleSet"),
  })
  .check(invariant_rpcConfigsSpecifiedForRootChain)
  .check(invariant_ensIndexerPublicConfigVersionInfo);

export type EnsApiConfig = z.infer<typeof EnsApiConfigSchema>;

/**
 * Loads the referral program cycle set from a custom URL or uses defaults.
 *
 * @param customCyclesUrl - Optional URL to a JSON file containing custom cycle definitions
 * @param namespace - The ENS namespace to get the subregistry address for
 * @returns A map of cycle IDs to their cycle configurations
 */
async function loadReferralProgramCycleSet(
  customCyclesUrl: string | undefined,
  namespace: ENSNamespaceId,
): Promise<ReferralProgramCycleSet> {
  const subregistryId = getEthnamesSubregistryId(namespace);

  if (!customCyclesUrl) {
    logger.info("Using default referral program cycle set");
    return getReferralProgramCycleSet(subregistryId);
  }

  // Validate URL format
  try {
    new URL(customCyclesUrl);
  } catch {
    throw new Error(`CUSTOM_REFERRAL_PROGRAM_CYCLES is not a valid URL: ${customCyclesUrl}`);
  }

  // Fetch and validate
  logger.info(`Fetching custom referral program cycles from: ${customCyclesUrl}`);

  let response: Response;
  try {
    response = await fetch(customCyclesUrl);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to fetch custom referral program cycles from ${customCyclesUrl}: ${errorMessage}. ` +
        `Please verify the URL is accessible and the server is running.`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch custom referral program cycles from ${customCyclesUrl}: ${response.status} ${response.statusText}`,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (_error) {
    throw new Error(
      `Failed to parse JSON from ${customCyclesUrl}: The response is not valid JSON. ` +
        `Please verify the file contains valid JSON.`,
    );
  }
  const schema = makeCustomReferralProgramCyclesSchema("CUSTOM_REFERRAL_PROGRAM_CYCLES");
  const validated = schema.parse(json);

  const cycleSet: ReferralProgramCycleSet = new Map();
  for (const cycleObj of validated) {
    const cycle = cycleObj as ReferralProgramCycle;
    const cycleId = cycle.id;
    cycleSet.set(cycleId, cycle);
  }

  logger.info(`Loaded ${cycleSet.size} custom referral program cycles`);
  return cycleSet;
}

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

    const referralProgramCycleSet = await loadReferralProgramCycleSet(
      env.CUSTOM_REFERRAL_PROGRAM_CYCLES,
      ensIndexerPublicConfig.namespace,
    );

    return EnsApiConfigSchema.parse({
      port: env.PORT,
      databaseUrl: env.DATABASE_URL,
      ensIndexerUrl: env.ENSINDEXER_URL,
      theGraphApiKey: env.THEGRAPH_API_KEY,
      ensIndexerPublicConfig: serializeENSIndexerPublicConfig(ensIndexerPublicConfig),
      namespace: ensIndexerPublicConfig.namespace,
      databaseSchemaName: ensIndexerPublicConfig.databaseSchemaName,
      rpcConfigs,
      referralProgramCycleSet,
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
