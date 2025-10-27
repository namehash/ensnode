import pRetry from "p-retry";
import { prettifyError, ZodError, z } from "zod/v4";

import { ENSNodeClient, serializeENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";
import {
  buildRpcConfigsFromEnv,
  DatabaseSchemaNameSchema,
  DatabaseUrlSchema,
  ENSNamespaceSchema,
  EnsIndexerUrlSchema,
  invariant_rpcConfigsSpecifiedForRootChain,
  makeENSIndexerPublicConfigSchema,
  PortSchema,
  RpcConfigsSchema,
} from "@ensnode/ensnode-sdk/internal";

import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import type { EnsApiEnvironment } from "@/config/environment";
import { invariant_ensIndexerPublicConfigVersionInfo } from "@/config/validations";

const EnsApiConfigSchema = z
  .object({
    port: PortSchema.default(ENSApi_DEFAULT_PORT),
    databaseUrl: DatabaseUrlSchema,
    databaseSchemaName: DatabaseSchemaNameSchema,
    ensIndexerUrl: EnsIndexerUrlSchema,
    namespace: ENSNamespaceSchema,
    rpcConfigs: RpcConfigsSchema,
    ensIndexerPublicConfig: makeENSIndexerPublicConfigSchema("ensIndexerPublicConfig"),
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
    const client = new ENSNodeClient({ url: ensIndexerUrl });

    const ensIndexerPublicConfig = await pRetry(() => client.config(), {
      retries: 3,
      onFailedAttempt: ({ error, attemptNumber, retriesLeft }) => {
        console.log(
          `ENSIndexer Config fetch attempt ${attemptNumber} failed (${error.message}). ${retriesLeft} retries left.`,
        );
      },
    });

    const rpcConfigs = buildRpcConfigsFromEnv(env, ensIndexerPublicConfig.namespace);

    return EnsApiConfigSchema.parse({
      port: env.PORT,
      databaseUrl: env.DATABASE_URL,
      ensIndexerUrl: env.ENSINDEXER_URL,

      ensIndexerPublicConfig: serializeENSIndexerPublicConfig(ensIndexerPublicConfig),
      namespace: ensIndexerPublicConfig.namespace,
      databaseSchemaName: ensIndexerPublicConfig.databaseSchemaName,
      rpcConfigs,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(
        "Failed to parse environment configuration: \n" + prettifyError(error) + "\n",
      );
    }

    if (error instanceof Error) {
      error.message = `Failed to build EnsApiConfig: ${error.message}`;
    }

    throw error;
  }
}
