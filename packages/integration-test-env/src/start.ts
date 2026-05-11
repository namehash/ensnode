/**
 * `pnpm -F @ensnode/integration-test-env start`
 *
 * Brings up the full integration test environment and blocks until Ctrl+C. Cleanup is handled
 * by the SIGINT/SIGTERM handler registered in `lifecycle.ts`.
 *
 * Use this when you want to point `pnpm test:integration` (or anything else) at a long-lived
 * stack from another terminal. For the CI flow that brings up the stack, runs tests, and tears
 * down, use `pnpm start:ci` (ci.ts).
 *
 * Pass `--only` to start a subset of services (comma-separated):
 *   pnpm -F @ensnode/integration-test-env start --only devnet,ensrainbow
 *
 * Valid services: devnet (incl. ensdb + seed), ensrainbow, ensindexer, ensapi.
 * Useful when iterating on ensindexer/ensapi locally and you want the rest auto-managed.
 */

import { parseArgs } from "node:util";

import { bringUp, cleanup, endpoints, parseOnly, type Service } from "./lifecycle";

function log(msg: string) {
  console.log(`[start] ${msg}`);
}

function parseCliArgs(): { only?: Set<Service> } {
  const { values } = parseArgs({
    options: {
      only: { type: "string" },
    },
    strict: true,
    allowPositionals: false,
  });
  if (values.only === undefined) return {};
  return { only: parseOnly(values.only) };
}

async function main() {
  const { only } = parseCliArgs();

  await bringUp({ only });

  const started = (svc: Service) => !only || only.has(svc);

  log("Stack is up. Press Ctrl+C to tear down.");
  if (started("ensapi")) log(`  ENSApi:     ${endpoints.ensapi}`);
  if (started("ensindexer")) log(`  ENSIndexer: ${endpoints.ensindexer}`);
  if (started("ensrainbow")) log(`  ENSRainbow: ${endpoints.ensrainbow}`);
  if (started("devnet")) {
    log(`  ENSDb:      ${endpoints.ensdb}`);
    log(`  Devnet RPC: ${endpoints.devnetRpc}`);
  }

  // Block forever — SIGINT/SIGTERM handlers in lifecycle.ts call cleanup() and exit.
  await new Promise<never>(() => {});
}

main().catch(async (e: unknown) => {
  console.error(`[start] ERROR: ${String(e)}`);
  await cleanup();
  process.exit(1);
});
