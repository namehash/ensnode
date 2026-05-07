import { parse as parseConnectionString } from "pg-connection-string";
import { z } from "zod/v4";

export const EnsDbUrlSchema = z.string().refine(
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
      "Invalid PostgreSQL connection string for ENSDb. Expected format: postgresql://username:password@host:port/database",
  },
);

const EnsIndexerSchemaNameSchema = z
  .string({
    error: "ENSIndexer Schema Name is required.",
  })
  .trim()
  .nonempty({
    error: "ENSIndexer Schema Name cannot be an empty string.",
  });

export const EnsDbConfigSchema = z.object({
  ensDbUrl: EnsDbUrlSchema,
  ensIndexerSchemaName: EnsIndexerSchemaNameSchema,
});
