import { DB_SCHEMA_VERSION } from "@/lib/database";

/**
 * Invariant: dbSchemaVersion must match the version expected by the code.
 */
export function invariant_dbSchemaVersionMatch(ctx: any): void {
  const { value: config } = ctx;

  if (config.dbSchemaVersion !== DB_SCHEMA_VERSION) {
    ctx.issues.push({
      code: "custom",
      path: ["dbSchemaVersion"],
      input: config.dbSchemaVersion,
      message: `DB_SCHEMA_VERSION mismatch! Code expects version ${DB_SCHEMA_VERSION}, but found ${config.dbSchemaVersion} in environment variables.`,
    });
  }
}
