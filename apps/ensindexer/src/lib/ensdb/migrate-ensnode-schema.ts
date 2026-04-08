import { createRequire } from "node:module";
import { join } from "node:path";

import { logger } from "@/lib/logger";

import { ensDbClient } from "./singleton";

// Resolve the path to the migrations directory within the ENSDb SDK package
const migrationsDirPath = join(
  createRequire(import.meta.url).resolve("@ensnode/ensdb-sdk"),
  "../../migrations",
);

/**
 * Execute database migrations for ENSNode Schema in ENSDb.
 */
export async function migrateEnsNodeSchema(): Promise<void> {
  logger.debug({
    msg: "Started database migrations",
    module: "migrate-ensnode-schema",
  });
  await ensDbClient.migrateEnsNodeSchema(migrationsDirPath);
  logger.info({
    msg: "Completed database migrations",
    module: "migrate-ensnode-schema",
  });
}
