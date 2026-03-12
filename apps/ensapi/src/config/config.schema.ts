import packageJson from "@/../package.json" with { type: "json" };

import { parse as parseConnectionString } from "pg-connection-string";
import { prettifyError, ZodError, z } from "zod/v4";

import type { EnsApiPublicConfig } from "@ensnode/ensnode-sdk";
import {
  buildRpcConfigsFromEnv,
  canFallbackToTheGraph,
  DatabaseSchemaNameSchema,
  ENSNamespaceSchema,
  EnsIndexerUrlSchema,
  invariant_rpcConfigsSpecifiedForRootChain,
  makeENSIndexerPublicConfigSchema,
  OptionalPortNumberSchema,
  RpcConfigsSchema,
  TheGraphApiKeySchema,
} from "@ensnode/ensnode-sdk/internal";

import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import type { EnsApiEnvironment } from "@/config/environment";
import { invariant_ensIndexerPublicConfigVersionInfo } from "@/config/validations";
import { EnsDbClient } from "@/lib/ensdb-client/ensdb-client";
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
    databaseUrl: DatabaseUrlSchema,
    databaseSchemaName: DatabaseSchemaNameSchema,
    ensIndexerUrl: EnsIndexerUrlSchema,
    theGraphApiKey: TheGraphApiKeySchema,
    namespace: ENSNamespaceSchema,
    rpcConfigs: RpcConfigsSchema,
    ensIndexerPublicConfig: makeENSIndexerPublicConfigSchema("ensIndexerPublicConfig"),
    customReferralProgramEditionConfigSetUrl: CustomReferralProgramEditionConfigSetUrlSchema,
  })
  .check(invariant_rpcConfigsSpecifiedForRootChain)
  .check(invariant_ensIndexerPublicConfigVersionInfo);

export type EnsApiConfig = z.infer<typeof EnsApiConfigSchema>;

/**
 * Builds an instance of {@link EnsDbClient} using environment variables.
 *
 * @returns instance of {@link EnsDbClient}
 * @throws Error with formatted validation messages if environment parsing fails
 */
function buildEnsDbClientFromEnvironment(env: EnsApiEnvironment): EnsDbClient {
  const databaseUrl = DatabaseUrlSchema.parse(env.DATABASE_URL);
  const ensIndexerSchemaName = DatabaseSchemaNameSchema.parse(env.DATABASE_SCHEMA);

  return new EnsDbClient(databaseUrl, ensIndexerSchemaName);
}

/**
 * Builds the EnsApiConfig from an EnsApiEnvironment object, fetching the EnsIndexerPublicConfig.
 *
 * @returns A validated EnsApiConfig object
 * @throws Error with formatted validation messages if environment parsing fails
 */
export async function buildConfigFromEnvironment(env: EnsApiEnvironment): Promise<EnsApiConfig> {
  try {
    const ensDbClient = buildEnsDbClientFromEnvironment(env);

    const ensIndexerPublicConfig = await ensDbClient.getEnsIndexerPublicConfig();

    if (!ensIndexerPublicConfig) {
      throw new Error("Failed to load EnsIndexerPublicConfig from ENSDb.");
    }

    const rpcConfigs = buildRpcConfigsFromEnv(env, ensIndexerPublicConfig.namespace);

    return EnsApiConfigSchema.parse({
      port: env.PORT,
      databaseUrl: env.DATABASE_URL,
      ensIndexerUrl: env.ENSINDEXER_URL,
      theGraphApiKey: env.THEGRAPH_API_KEY,
      ensIndexerPublicConfig,
      namespace: ensIndexerPublicConfig.namespace,
      databaseSchemaName: ensIndexerPublicConfig.databaseSchemaName,
      rpcConfigs,
      customReferralProgramEditionConfigSetUrl: env.CUSTOM_REFERRAL_PROGRAM_EDITIONS,
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
