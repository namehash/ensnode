import { parse as parseConnectionString } from "pg-connection-string";
import { prettifyError, z } from "zod/v4";

import { DatabaseSchemaNameSchema } from "@ensnode/ensnode-sdk/internal";

import type { EnsApiEnvironment } from "@/config/environment";
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

export const EnsDbConfigSchema = z.object({
  databaseUrl: DatabaseUrlSchema,
  databaseSchemaName: DatabaseSchemaNameSchema,
});

export type EnsDbConfig = z.infer<typeof EnsDbConfigSchema>;

/**
 * Build ENSDb config from environment variables.
 *
 * Exits the process if the configuration is invalid, logging the error details.
 */
export function buildEnsDbConfigFromEnvironment(env: EnsApiEnvironment): EnsDbConfig {
  const ensDbConfig = EnsDbConfigSchema.safeParse({
    databaseUrl: env.DATABASE_URL,
    databaseSchemaName: env.DATABASE_SCHEMA,
  });

  if (!ensDbConfig.success) {
    logger.error(
      `Failed to parse ENSDb configuration from environment: \n${prettifyError(ensDbConfig.error)}\n`,
    );
    process.exit(1);
  }

  return ensDbConfig.data;
}
