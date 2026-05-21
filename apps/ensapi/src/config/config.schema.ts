import { prettifyError, ZodError, z } from "zod/v4";

import {
  type ENSNamespaceId,
  type EnsApiPublicConfig,
  type EnsIndexerPublicConfig,
  getENSRootChainId,
} from "@ensnode/ensnode-sdk";
import {
  buildRpcConfigsFromEnv,
  canFallbackToTheGraph,
  OptionalPortNumberSchema,
  type RpcConfig,
  RpcConfigsSchema,
  TheGraphApiKeySchema,
} from "@ensnode/ensnode-sdk/internal";

import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import type { EnsApiEnvironment } from "@/config/environment";
import logger from "@/lib/logger";
import { ensApiVersionInfo } from "@/lib/version-info";

/**
 * Schema for validating the referral program edition config set URL.
 */
const ReferralProgramEditionConfigSetUrlSchema = z
  .string()
  .transform((val, ctx) => {
    try {
      return new URL(val);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: `REFERRAL_PROGRAM_EDITIONS is not a valid URL: ${val}`,
      });
      return z.NEVER;
    }
  })
  .optional();

const EnsApiConfigSchema = z.object({
  port: OptionalPortNumberSchema.default(ENSApi_DEFAULT_PORT),
  theGraphApiKey: TheGraphApiKeySchema,
  referralProgramEditionConfigSetUrl: ReferralProgramEditionConfigSetUrlSchema,
});

export type EnsApiConfig = z.infer<typeof EnsApiConfigSchema>;

/**
 * Builds the EnsApiConfig from an EnsApiEnvironment object.
 *
 * Note: If error occurs during parsing/validation, the error will be logged and the process
 * will exit with code 1.
 *
 * @returns A validated EnsApiConfig object
 */
export function buildConfigFromEnvironment(env: EnsApiEnvironment): EnsApiConfig {
  try {
    return EnsApiConfigSchema.parse({
      port: env.PORT,
      theGraphApiKey: env.THEGRAPH_API_KEY,
      referralProgramEditionConfigSetUrl: env.REFERRAL_PROGRAM_EDITIONS,
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
 * Builds the RPC config for the root chain based on the provided environment and ENS namespace ID.
 * @param env - The environment variables for the ENSApi
 * @param ensNamespaceId - The ENS namespace ID
 * @returns The RPC config for the root chain
 *
 * Note: If error occurs during parsing/validation, the error will be logged and the process
 * will exit with code 1.
 */
export function buildRootChainRpcConfig(
  env: EnsApiEnvironment,
  ensNamespaceId: ENSNamespaceId,
): RpcConfig {
  try {
    const unvalidatedRpcConfigs = buildRpcConfigsFromEnv(env, ensNamespaceId);
    const rootChainId = getENSRootChainId(ensNamespaceId);
    const rpcConfigs = RpcConfigsSchema.parse(unvalidatedRpcConfigs);
    const rootChainRpcConfig = rpcConfigs.get(rootChainId);

    if (!rootChainRpcConfig) {
      throw new Error(
        `RPC configuration for root chain (chainId: ${rootChainId}) is required but was not found in the environment variables.`,
      );
    }

    return rootChainRpcConfig;
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(`Failed to parse environment configuration: \n${prettifyError(error)}\n`);
    } else if (error instanceof Error) {
      logger.error(error, `Failed to build the root chain RPC config`);
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
export function buildEnsApiPublicConfig(
  ensApiConfig: EnsApiConfig,
  ensIndexerPublicConfig: EnsIndexerPublicConfig,
): EnsApiPublicConfig {
  return {
    versionInfo: ensApiVersionInfo,
    theGraphFallback: canFallbackToTheGraph({
      namespace: ensIndexerPublicConfig.namespace,
      // NOTE: very important here that we replace the actual server-side api key with a placeholder
      // so that it's not sent to clients as part of the `theGraphFallback.url`. The placeholder must
      // pass validation, of course, but the only validation necessary is that it is a string.
      theGraphApiKey: ensApiConfig.theGraphApiKey ? "<API_KEY>" : undefined,
      isSubgraphCompatible: ensIndexerPublicConfig.isSubgraphCompatible,
    }),
    ensIndexerPublicConfig,
  };
}
