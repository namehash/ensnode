import { EnsApiEnvironment } from "@/config/environment";
import {
  DatabaseSchemaNameSchema,
  DatabaseUrlSchema,
  EnsIndexerUrlSchema,
  RpcConfigsSchema,
  buildRpcConfigsFromEnv,
} from "@ensnode/ensnode-sdk/internal";
import { ZodError, prettifyError, z } from "zod/v4";

const EnsApiConfigSchema = z.object({
  databaseUrl: DatabaseUrlSchema,
  databaseSchemaName: DatabaseSchemaNameSchema,
  rpcConfigs: RpcConfigsSchema,
  ensIndexerUrl: EnsIndexerUrlSchema,
});

export type EnsApiConfig = z.infer<typeof EnsApiConfigSchema>;

/**
 * Builds the EnsApiConfig from an EnsApiEnvironment object.
 *
 * @returns A validated EnsApiConfig object
 * @throws Error with formatted validation messages if environment parsing fails
 */
export function buildConfigFromEnvironment(env: EnsApiEnvironment): EnsApiConfig {
  try {
    return EnsApiConfigSchema.parse({
      databaseUrl: env.DATABASE_URL,
      databaseSchemaName: env.DATABASE_SCHEMA,
      rpcConfigs: buildRpcConfigsFromEnv(env, "sepolia"), // TODO: building rpc configs is namespace-dependent...
      ensIndexerUrl: env.ENSINDEXER_URL,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(
        "Failed to parse environment configuration: \n" + prettifyError(error) + "\n",
      );
    }

    throw error;
  }
}
