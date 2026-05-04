/**
 * Integration Test Environment Orchestrator
 *
 * Spins up the full ENSNode stack against the ens-test-env devnet, runs
 * monorepo-level integration tests, then tears everything down.
 *
 * Phases:
 *   1. ENSDb (postgres) + devnet via docker-compose (testcontainers DockerComposeEnvironment)
 *   2. Start ENSRainbow via `pnpm entrypoint` (downloads + extracts the prebuilt LevelDB in the background)
 *   3. Start ENSIndexer, wait for omnichain-following / omnichain-completed
 *   4. Start ENSApi
 *   5. Run `pnpm test:integration` at the monorepo root
 *
 * Design decisions:
 *   - ENSDb (postgres) and devnet are started from docker/docker-compose.orchestrator.yml via
 *     testcontainers DockerComposeEnvironment, ensuring the orchestrator always
 *     uses the same images and configuration defined there.
 *   - execa for child process management — automatic cleanup on parent exit,
 *     forceKillAfterDelay (10s SIGKILL fallback), env inherited from parent.
 *   - Services run from source (pnpm start/serve) rather than Docker so that
 *     CI tests the actual code in the PR.
 *   - ENSRainbow uses the same `pnpm entrypoint` command as the Docker image —
 *     it boots the HTTP server immediately and bootstraps the DB asynchronously,
 *     so we wait on `/ready` (not `/health`) before moving to the next phase.
 *   - Cleanup stops processes in reverse order (ensapi → ensindexer → ensrainbow)
 *     so DB consumers close connections before ensdb is stopped.
 *   - Abort flag pattern: if a background service crashes during polling/health
 *     checks, the orchestrator fails fast instead of waiting for a timeout.
 *   - SIGINT/SIGTERM handler is guarded against re-entrance (repeated Ctrl-C).
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

async function cleanup() {
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
  console.log(`[orchestrator] ${msg}`);
}

function logError(msg: string) {
  console.error(`[orchestrator] ERROR: ${msg}`);
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

async function main() {
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
    transport: http(ensTestEnvChain.rpcUrls.default.http[0]),
  });
  const devnetChainId = await publicClient.getChainId();
  if (devnetChainId !== ensTestEnvChain.id) {
    throw new Error(
      `Devnet chain id mismatch: got ${devnetChainId}, expected ${ensTestEnvChain.id}.`,
    );
  }

  log("Devnet is ready");

  // Phase 2: Start ENSRainbow via the entrypoint command, which downloads and
  // extracts the prebuilt database in the background and serves once attached.
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
  await waitForHealth(`http://localhost:${ENSRAINBOW_PORT}/ready`, 30_000, "ENSRainbow");

  // Phase 3: Start ENSIndexer
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

  // Phase 4: Wait for indexing to complete
  await pollIndexingStatus(ENSDB_URL, ENSINDEXER_SCHEMA_NAME, 30_000);

  // Phase 5: Start ENSApi
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
  await waitForHealth(`http://localhost:${ENSAPI_PORT}/health`, 10_000, "ENSApi");

  // Phase 6: Run integration tests
  log("Running integration tests...");
  execaSync("pnpm", ["test:integration", "--", "--bail", "1"], {
    cwd: MONOREPO_ROOT,
    stdio: "inherit",
    env: {
      ENSNODE_URL: `http://localhost:${ENSAPI_PORT}`,
    },
  });
  log("Integration tests passed!");

  await cleanup();
  process.exit(0);
}

main().catch(async (e: unknown) => {
  logError(String(e));
  await cleanup();
  process.exit(1);
});
