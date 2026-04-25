import { prettifyError, ZodError, z } from "zod/v4";

import type { EnsApiPublicConfig, EnsIndexerPublicConfig } from "@ensnode/ensnode-sdk";
import {
  canFallbackToTheGraph,
  OptionalPortNumberSchema,
  TheGraphApiKeySchema,
} from "@ensnode/ensnode-sdk/internal";

import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import ensDbConfig from "@/config/ensdb-config";
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

  // include the ENSDbConfig params in the EnsApiConfigSchema
  ensDbUrl: z.string(),
  ensIndexerSchemaName: z.string(),
});
// .check(invariant_rpcConfigsSpecifiedForRootChain)
// .check(invariant_ensIndexerPublicConfigVersionInfo);

export type EnsApiConfig = z.infer<typeof EnsApiConfigSchema>;

/**
 * Builds the EnsApiConfig from an EnsApiEnvironment object, fetching the EnsIndexerPublicConfig.
 *
 * @returns A validated EnsApiConfig object
 * @throws Error with formatted validation messages if environment parsing fails
 */
export function buildConfigFromEnvironment(env: EnsApiEnvironment): EnsApiConfig {
  try {
    return EnsApiConfigSchema.parse({
      port: env.PORT,
      theGraphApiKey: env.THEGRAPH_API_KEY,
      referralProgramEditionConfigSetUrl: env.REFERRAL_PROGRAM_EDITIONS,

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
 * @param ensApiConfig - The validated EnsApiConfig object
 * @param ensIndexerPublicConfig - The validated ENSIndexerPublicConfig object
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
  };
}
