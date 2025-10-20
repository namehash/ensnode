import { ENSAPI_DEFAULT_PORT } from "@/config/defaults";
import { EnsApiEnvironment } from "@/config/environment";
import {
  DatabaseSchemaNameSchema,
  DatabaseUrlSchema,
  ENSNamespaceSchema,
  EnsIndexerUrlSchema,
  PortSchema,
  RpcConfigsSchema,
  buildRpcConfigsFromEnv,
  invariant_rpcConfigsSpecifiedForRootChain,
} from "@ensnode/ensnode-sdk/internal";
import { ZodError, prettifyError, z } from "zod/v4";

const EnsApiConfigSchema = z
  .object({
    port: PortSchema.default(ENSAPI_DEFAULT_PORT),
    databaseUrl: DatabaseUrlSchema,
    databaseSchemaName: DatabaseSchemaNameSchema,
    ensIndexerUrl: EnsIndexerUrlSchema,

    // TODO(derive-namespace): derive namepace knowledge from connected ensindexer
    namespace: ENSNamespaceSchema,
    rpcConfigs: RpcConfigsSchema,
  })
  // TODO(derive-namespace): move this invariant to rpcConfig generation
  .check(invariant_rpcConfigsSpecifiedForRootChain);

export type EnsApiConfig = z.infer<typeof EnsApiConfigSchema>;

/**
 * Builds the EnsApiConfig from an EnsApiEnvironment object.
 *
 * @returns A validated EnsApiConfig object
 * @throws Error with formatted validation messages if environment parsing fails
 */
export function buildConfigFromEnvironment(env: EnsApiEnvironment): EnsApiConfig {
  try {
    // TODO(derive-namespace): defer rpcConfig knowledge until ensindexer namespace is known
    const namespace = ENSNamespaceSchema.parse(env.NAMESPACE);
    const rpcConfigs = buildRpcConfigsFromEnv(env, namespace);

    return EnsApiConfigSchema.parse({
      port: env.PORT,
      databaseUrl: env.DATABASE_URL,
      databaseSchemaName: env.DATABASE_SCHEMA,
      ensIndexerUrl: env.ENSINDEXER_URL,

      // TODO(derive-namespace): can remove after refactor
      namespace: env.NAMESPACE,
      rpcConfigs,
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
