/**
 * `pnpm -F @ensnode/integration-test-env start:ci`
 *
 * Integration Test Environment Orchestrator (CI flow).
 *
 * Brings up the full stack, runs monorepo-level integration tests, then tears everything down.
 * For the manual flow that brings up the stack and waits for Ctrl+C without running tests, use
 * `pnpm start` (start.ts).
 *
 * Phases (lifecycle.bringUp + test run):
 *   1. ENSDb (postgres) + devnet via docker-compose (testcontainers DockerComposeEnvironment)
 *   2. Seed devnet (primary names and resolver records)
 *   3. Start ENSRainbow via `pnpm entrypoint` (downloads + extracts the prebuilt LevelDB in the background)
 *   4. Start ENSIndexer
 *   5. Wait for omnichain-following / omnichain-completed (indexing complete)
 *   6. Start ENSApi
 *   7. Run `pnpm test:integration` at the monorepo root
 */

import { bringUp, cleanup, runIntegrationTests } from "./lifecycle";

async function main() {
  await bringUp();
  runIntegrationTests();

  await cleanup();
  process.exit(0);
}

main().catch(async (e: unknown) => {
  console.error(`[orchestrator] ERROR: ${String(e)}`);
  await cleanup();
  process.exit(1);
});
