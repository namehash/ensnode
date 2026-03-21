import { createRequire } from "node:module";
import { join } from "node:path";

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
  console.log(`Running database migrations for ENSNode Schema in ENSDb.`);
  await ensDbClient.migrateEnsNodeSchema(migrationsDirPath);
  console.log(`Database migrations for ENSNode Schema in ENSDb completed successfully.`);
}
