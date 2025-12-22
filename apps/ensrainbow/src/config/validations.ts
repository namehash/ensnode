import type { z } from "zod/v4";

import { DB_SCHEMA_VERSION } from "@/lib/database";

import type { ENSRainbowConfig } from "./config.schema";

/**
 * Zod `.check()` function input.
 */
type ZodCheckFnInput<T> = z.core.ParsePayload<T>;

/**
 * Invariant: dbSchemaVersion must match the version expected by the code.
 */
export function invariant_dbSchemaVersionMatch(
  ctx: ZodCheckFnInput<Pick<ENSRainbowConfig, "dbSchemaVersion">>,
): void {
  const { value: config } = ctx;

  if (config.dbSchemaVersion !== undefined && config.dbSchemaVersion !== DB_SCHEMA_VERSION) {
    throw new Error(
      `DB_SCHEMA_VERSION mismatch! Expected version ${DB_SCHEMA_VERSION} from code, but found ${config.dbSchemaVersion} in environment variables.`,
    );
  }
}
