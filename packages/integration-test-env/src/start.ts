/**
 * `pnpm -F @ensnode/integration-test-env start`
 *
 * Brings up the full integration test environment and blocks until Ctrl+C. Cleanup is handled
 * by the SIGINT/SIGTERM handler registered in `lifecycle.ts`.
 *
 * Use this when you want to point `pnpm test:integration` (or anything else) at a long-lived
 * stack from another terminal. For the CI flow that brings up the stack, runs tests, and tears
 * down, use `pnpm start:ci` (ci.ts).
 */

import { bringUp, cleanup, endpoints } from "./lifecycle";

function log(msg: string) {
  console.log(`[start] ${msg}`);
}

async function main() {
  await bringUp();

  log("Stack is up. Press Ctrl+C to tear down.");
  log(`  ENSApi:     ${endpoints.ensapi}`);
  log(`  ENSIndexer: ${endpoints.ensindexer}`);
  log(`  ENSRainbow: ${endpoints.ensrainbow}`);
  log(`  ENSDb:      ${endpoints.ensdb}`);
  log(`  Devnet RPC: ${endpoints.devnetRpc}`);

  // Block forever — SIGINT/SIGTERM handlers in lifecycle.ts call cleanup() and exit.
  await new Promise<never>(() => {});
}

main().catch(async (e: unknown) => {
  console.error(`[start] ERROR: ${String(e)}`);
  await cleanup();
  process.exit(1);
});
