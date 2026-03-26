import { z } from "zod/v4";

export const schemaEnsDbPublicConfig = z.object({
  postgresVersion: z.string().min(1, "PostgreSQL version must be a non-empty string."),
  rootSchemaVersion: z.string().min(1, "Root Schema version must be a non-empty string."),
});
