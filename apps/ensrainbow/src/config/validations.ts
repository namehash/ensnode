import type { z } from "zod/v4";

import { DB_SCHEMA_VERSION } from "@/lib/database";

export function invariant_dbSchemaVersionMatch(
  ctx: z.core.ParsePayload<{
    port: number;
    dataDir: string;
    dbSchemaVersion: number;
    labelSet?: { labelSetId: string; labelSetVersion: number };
  }>,
): void {
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
