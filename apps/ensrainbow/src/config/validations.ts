import type { ZodCheckFnInput } from "@ensnode/ensnode-sdk/internal";

import { DB_SCHEMA_VERSION } from "@/lib/database";

import type { ENSRainbowConfig } from "./config.schema";

/**
 * Invariant: dbSchemaVersion must match the version expected by the code.
 */
export function invariant_dbSchemaVersionMatch(ctx: ZodCheckFnInput<ENSRainbowConfig>): void {
  const { value: config } = ctx;

  if (config.dbSchemaVersion !== undefined && config.dbSchemaVersion !== DB_SCHEMA_VERSION) {
    ctx.issues.push({
      code: "custom",
      path: ["dbSchemaVersion"],
      input: config.dbSchemaVersion,
      message: `DB_SCHEMA_VERSION mismatch! Expected version ${DB_SCHEMA_VERSION} from code, but found ${config.dbSchemaVersion} in environment variables.`,
    });
  }
}
