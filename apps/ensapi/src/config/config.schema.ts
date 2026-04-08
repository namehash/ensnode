import pRetry from "p-retry";
import { prettifyError, ZodError, z } from "zod/v4";

import type { EnsApiPublicConfig } from "@ensnode/ensnode-sdk";
import {
  buildRpcConfigsFromEnv,
  canFallbackToTheGraph,
  ENSNamespaceSchema,
  invariant_rpcConfigsSpecifiedForRootChain,
  makeENSIndexerPublicConfigSchema,
  OptionalPortNumberSchema,
  RpcConfigsSchema,
  TheGraphApiKeySchema,
} from "@ensnode/ensnode-sdk/internal";

import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import ensDbConfig from "@/config/ensdb-config";
import type { EnsApiEnvironment } from "@/config/environment";
import { invariant_ensIndexerPublicConfigVersionInfo } from "@/config/validations";
import { ensDbClient } from "@/lib/ensdb/singleton";
import logger from "@/lib/logger";
import { ensApiVersionInfo } from "@/lib/version-info";

/**
 * Schema for validating custom referral program edition config set URL.
 */
const CustomReferralProgramEditionConfigSetUrlSchema = z
  .string()
  .transform((val, ctx) => {
    try {
      return new URL(val);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: `CUSTOM_REFERRAL_PROGRAM_EDITIONS is not a valid URL: ${val}`,
      });
      return z.NEVER;
    }
  })
  .optional();

const EnsApiConfigSchema = z
  .object({
    port: OptionalPortNumberSchema.default(ENSApi_DEFAULT_PORT),
    theGraphApiKey: TheGraphApiKeySchema,
    namespace: ENSNamespaceSchema,
    rpcConfigs: RpcConfigsSchema,
    ensIndexerPublicConfig: makeENSIndexerPublicConfigSchema("ensIndexerPublicConfig"),
    customReferralProgramEditionConfigSetUrl: CustomReferralProgramEditionConfigSetUrlSchema,

    // include the ENSDbConfig params in the EnsApiConfigSchema
    ensDbUrl: z.string(),
    ensIndexerSchemaName: z.string(),
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
    // TODO: transfer the responsibility of fetching
    // the ENSIndexer Public Config to a middleware layer, as per:
    // https://github.com/namehash/ensnode/issues/1806
    const ensIndexerPublicConfig = await pRetry(
      async () => {
        const config = await ensDbClient.getEnsIndexerPublicConfig();

        if (!config) {
          throw new Error("ENSIndexer Public Config not yet available in ENSDb.");
        }

        return config;
      },
      {
        retries: 13, // This allows for a total of over 1 hour of retries with the exponential backoff strategy
        onFailedAttempt: ({ error, attemptNumber, retriesLeft }) => {
          logger.info(
            `ENSIndexer Public Config fetch attempt ${attemptNumber} failed (${error.message}). ${retriesLeft} retries left.`,
          );
        },
      },
    );

    const rpcConfigs = buildRpcConfigsFromEnv(env, ensIndexerPublicConfig.namespace);

    return EnsApiConfigSchema.parse({
      port: env.PORT,
      theGraphApiKey: env.THEGRAPH_API_KEY,
      ensIndexerPublicConfig,
      namespace: ensIndexerPublicConfig.namespace,
      rpcConfigs,
      customReferralProgramEditionConfigSetUrl: env.CUSTOM_REFERRAL_PROGRAM_EDITIONS,

      // include the validated ENSDb config values in the parsed EnsApiConfig
      ensDbUrl: ensDbConfig.ensDbUrl,
      ensIndexerSchemaName: ensDbConfig.ensIndexerSchemaName,
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
export function buildEnsApiPublicConfig(config: EnsApiConfig): EnsApiPublicConfig {
  return {
    versionInfo: ensApiVersionInfo,
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
