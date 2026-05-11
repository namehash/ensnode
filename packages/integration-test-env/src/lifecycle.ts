/**
 * Integration Test Environment Lifecycle
 *
 * Brings up the full ENSNode stack (ENSDb + devnet → seed → ENSRainbow → ENSIndexer → ENSApi)
 * and provides shared cleanup + signal handling.
 *
 * Two entrypoints consume this module:
 *   - `ci.ts` — CI flow: bringUp() → run tests → cleanup()
 *   - `start.ts` — manual flow: bringUp() → block until Ctrl+C → cleanup() via signal handler
 */

import { resolve } from "node:path";

import { execaSync, type ResultPromise, execa as spawn } from "execa";
import {
  DockerComposeEnvironment,
  type StartedDockerComposeEnvironment,
  Wait,
} from "testcontainers";
import { createPublicClient, http } from "viem";

import { ENSNamespaceIds, ensTestEnvChain } from "@ensnode/datasources";
import {
  IndexingMetadataContextStatusCodes,
  OmnichainIndexingStatusIds,
} from "@ensnode/ensnode-sdk";

import { seedDevnet } from "./seed/index";

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../..");
const DOCKER_DIR = resolve(MONOREPO_ROOT, "docker");
const ENSRAINBOW_DIR = resolve(MONOREPO_ROOT, "apps/ensrainbow");
const ENSINDEXER_DIR = resolve(MONOREPO_ROOT, "apps/ensindexer");
const ENSAPI_DIR = resolve(MONOREPO_ROOT, "apps/ensapi");

// Ports
const ENSRAINBOW_PORT = 3223;
const ENSINDEXER_PORT = 42069;
const ENSAPI_PORT = 4334;
const ENSDB_PORT = 5433;

// Shared config
const ENSRAINBOW_URL = `http://localhost:${ENSRAINBOW_PORT}`;
const ENSINDEXER_SCHEMA_NAME = "ensindexer_integration_test";
const ENSDB_URL = `postgresql://postgres:password@localhost:${ENSDB_PORT}/postgres`;
const RPC_URL = ensTestEnvChain.rpcUrls.default.http[0];

export const endpoints = {
  ensapi: `http://localhost:${ENSAPI_PORT}`,
  ensindexer: `http://localhost:${ENSINDEXER_PORT}`,
  ensrainbow: ENSRAINBOW_URL,
  ensdb: ENSDB_URL,
  devnetRpc: RPC_URL,
} as const;

// Track resources for cleanup
const subprocesses: ResultPromise[] = [];
let composeEnvironment: StartedDockerComposeEnvironment | undefined;

// Abort flag — set when a spawned service crashes
let aborted = false;
let abortReason = "";
let cleanupInProgress = false;

function checkAborted() {
  if (aborted) {
    throw new Error(`Aborting: ${abortReason}`);
  }
}

function setAborted(reason: string) {
  if (cleanupInProgress) return;
  logError(reason);
  aborted = true;
  abortReason = reason;
}

export async function cleanup() {
  cleanupInProgress = true;
  log("Cleaning up...");

  // Kill child processes in reverse order (ensapi → ensindexer → ensrainbow)
  // so DB consumers disconnect before containers are stopped.
  // Kill the entire process group (-pid) so pnpm's children (the actual node
  // servers) are also terminated — pnpm doesn't forward SIGTERM to children.
  for (const subprocess of [...subprocesses].reverse()) {
    try {
      if (subprocess.pid) process.kill(-subprocess.pid, "SIGTERM");
    } catch {}
    subprocess.kill();
    await subprocess;
  }
  log("All child processes stopped");

  if (composeEnvironment) {
    try {
      // removeVolumes ensures the postgres volume is wiped between runs — Ponder rejects schemas
      // owned by a different prior app, so we cannot reuse the volume across runs.
      await composeEnvironment.down({ removeVolumes: true, timeout: 10_000 });
    } catch (error) {
      logError(
        `Failed to stop compose environment during cleanup: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
  log("All containers stopped");
}

async function handleShutdown() {
  if (cleanupInProgress) return;
  cleanupInProgress = true;
  log("Shutting down...");
  await cleanup();
  process.exit(1);
}

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

function log(msg: string) {
  console.log(`[lifecycle] ${msg}`);
}

function logError(msg: string) {
  console.error(`[lifecycle] ERROR: ${msg}`);
}

async function waitForHealth(url: string, timeoutMs: number, serviceName: string): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    checkAborted();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (res.ok) {
        log(`${serviceName} is healthy`);
        return;
      }
      log(`${serviceName} health check returned ${res.status}, retrying...`);
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${serviceName} did not become healthy within ${timeoutMs / 1000}s`);
}

function spawnService(
  command: string,
  args: string[],
  cwd: string,
  env: Record<string, string>,
  serviceName: string,
): ResultPromise {
  const subprocess = spawn(command, args, {
    cwd,
    env,
    stdout: "pipe",
    stderr: "pipe",
    reject: false,
    forceKillAfterDelay: 10_000,
    detached: true,
  });

  subprocess.stdout?.on("data", (data: Buffer) => {
    for (const line of data.toString().split("\n").filter(Boolean)) {
      console.log(`[${serviceName}] ${line}`);
    }
  });

  subprocess.stderr?.on("data", (data: Buffer) => {
    for (const line of data.toString().split("\n").filter(Boolean)) {
      console.error(`[${serviceName}] ${line}`);
    }
  });

  subprocess.then((result) => {
    if (result.failed && !result.isTerminated) {
      setAborted(`${serviceName} exited with code ${result.exitCode}`);
    }
  });

  subprocesses.push(subprocess);
  return subprocess;
}

async function pollIndexingStatus(
  ensDbUrl: string,
  ensIndexerSchemaName: string,
  timeoutMs: number,
): Promise<void> {
  const { EnsDbReader } = await import("@ensnode/ensdb-sdk");
  const ensDbClient = new EnsDbReader(ensDbUrl, ensIndexerSchemaName);

  const start = Date.now();
  log("Polling indexing status...");

  try {
    while (Date.now() - start < timeoutMs) {
      checkAborted();
      try {
        const indexingMetadataContext = await ensDbClient.getIndexingMetadataContext();

        if (
          indexingMetadataContext.statusCode === IndexingMetadataContextStatusCodes.Uninitialized
        ) {
          console.log("IndexingMetadataContext is uninitialized, waiting...");
        } else {
          const { omnichainStatus } = indexingMetadataContext.indexingStatus.omnichainSnapshot;
          log(`Omnichain status: ${omnichainStatus}`);
          if (
            omnichainStatus === OmnichainIndexingStatusIds.Following ||
            omnichainStatus === OmnichainIndexingStatusIds.Completed
          ) {
            log("Indexing reached target status");
            return;
          }
        }
      } catch {
        // indexer may not be ready yet
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
    throw new Error(`Indexing did not complete within ${timeoutMs / 1000}s`);
  } finally {
    console.log("Closing ENSDb client...");
    // @ts-expect-error - DrizzleClient.$client is not typed to have an `end` method,
    // but in practice it does (e.g. pg's Client does).
    await ensDbClient.ensDb.$client.end();
    console.log("ENSDb client closed");
  }
}

function logVersions() {
  log("Software versions:");
  log(`  Node.js:  ${process.version}`);
  log(`  pnpm:     ${execaSync("pnpm", ["--version"]).stdout.trim()}`);
  log(`  Docker:   ${execaSync("docker", ["--version"]).stdout.trim()}`);
}

/**
 * Bring up the integration test environment: ENSDb + Devnet, seed, ENSRainbow, ENSIndexer,
 * wait for indexing to complete, ENSApi. Returns once every service is healthy.
 *
 * On failure, runs cleanup() and rethrows.
 */
export async function bringUp(): Promise<void> {
  log("Starting integration test environment...");
  logVersions();

  // Phase 1: Start ENSDb + Devnet via docker-compose
  log("Starting ENSDb and Devnet...");
  composeEnvironment = await new DockerComposeEnvironment(
    DOCKER_DIR,
    "docker-compose.orchestrator.yml",
  )
    .withWaitStrategy("devnet-orchestrator", Wait.forHealthCheck())
    .withWaitStrategy("ensdb-orchestrator", Wait.forListeningPorts())
    .withStartupTimeout(120_000)
    .up(["ensdb", "devnet"]);

  log(`ENSDb is ready (port ${ENSDB_PORT})`);

  // Devnet Chain Id check
  const publicClient = createPublicClient({
    transport: http(RPC_URL),
  });
  const devnetChainId = await publicClient.getChainId();
  if (devnetChainId !== ensTestEnvChain.id) {
    throw new Error(
      `Devnet chain id mismatch: got ${devnetChainId}, expected ${ensTestEnvChain.id}.`,
    );
  }

  log(`Devnet is ready (RPC URL: ${RPC_URL})`);

  // Phase 2: Seed devnet with test data (before indexing starts)
  log("Seeding devnet...");
  await seedDevnet(RPC_URL);
  log("Devnet seeded");

  // Phase 3: Download ENSRainbow database and start from source
  const DB_SCHEMA_VERSION = "3";
  const LABEL_SET_ID = "ens-test-env";
  const LABEL_SET_VERSION = "0";

  log("Starting ENSRainbow (entrypoint will bootstrap the database)...");
  spawnService(
    "pnpm",
    ["entrypoint"],
    ENSRAINBOW_DIR,
    {
      LOG_LEVEL: "error",
      DB_SCHEMA_VERSION,
      LABEL_SET_ID,
      LABEL_SET_VERSION,
    },
    "ensrainbow",
  );
  // /ready returns 200 only after the DB has been downloaded, extracted, and attached.
  await waitForHealth(`${ENSRAINBOW_URL}/ready`, 30_000, "ENSRainbow");

  // Phase 4: Start ENSIndexer
  log("Starting ENSIndexer...");
  spawnService(
    "pnpm",
    ["start"],
    ENSINDEXER_DIR,
    {
      NAMESPACE: ENSNamespaceIds.EnsTestEnv,
      ENSDB_URL,
      ENSINDEXER_SCHEMA_NAME,
      PLUGINS: "ensv2,protocol-acceleration",
      ENSRAINBOW_URL,
      LABEL_SET_ID,
      LABEL_SET_VERSION,
    },
    "ensindexer",
  );
  await waitForHealth(`http://localhost:${ENSINDEXER_PORT}/health`, 60_000, "ENSIndexer");

  // Phase 5: Wait for indexing to complete
  await pollIndexingStatus(ENSDB_URL, ENSINDEXER_SCHEMA_NAME, 30_000);

  // Phase 6: Start ENSApi
  log("Starting ENSApi...");
  spawnService(
    "pnpm",
    ["start"],
    ENSAPI_DIR,
    {
      ENSDB_URL,
      ENSINDEXER_SCHEMA_NAME,
    },
    "ensapi",
  );
  await waitForHealth(`${endpoints.ensapi}/health`, 10_000, "ENSApi");
}

/**
 * Run `pnpm test:integration` at the monorepo root against the running stack.
 * Throws if vitest exits non-zero.
 */
export function runIntegrationTests(): void {
  log("Running integration tests...");
  execaSync("pnpm", ["test:integration", "--", "--bail", "1"], {
    cwd: MONOREPO_ROOT,
    stdio: "inherit",
    env: {
      ENSNODE_URL: endpoints.ensapi,
    },
  });
  log("Integration tests passed!");
}
