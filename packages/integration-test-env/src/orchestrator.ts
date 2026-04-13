/**
 * Integration Test Environment Orchestrator
 *
 * Spins up the full ENSNode stack against the ens-test-env devnet, runs
 * monorepo-level integration tests, then tears everything down.
 *
 * Phases:
 *   1. Postgres + devnet via docker-compose (testcontainers DockerComposeEnvironment)
 *   2. Download pre-built ENSRainbow LevelDB, extract, start ENSRainbow from source
 *   3. Start ENSIndexer, wait for omnichain-following / omnichain-completed
 *   4. Start ENSApi
 *   5. Run `pnpm test:integration` at the monorepo root
 *
 * Design decisions:
 *   - Postgres and devnet are started from the root docker-compose.yml via
 *     testcontainers DockerComposeEnvironment, ensuring the orchestrator always
 *     uses the same images and configuration defined there.
 *   - execa for child process management — automatic cleanup on parent exit,
 *     forceKillAfterDelay (10s SIGKILL fallback), env inherited from parent.
 *   - Services run from source (pnpm start/serve) rather than Docker so that
 *     CI tests the actual code in the PR.
 *   - ENSRainbow database is downloaded via the existing shell script and
 *     extracted with tar, mirroring the Docker entrypoint behavior.
 *   - Cleanup stops processes in reverse order (ensapi → ensindexer → ensrainbow)
 *     so DB consumers close connections before Postgres is stopped.
 *   - Abort flag pattern: if a background service crashes during polling/health
 *     checks, the orchestrator fails fast instead of waiting for a timeout.
 *   - SIGINT/SIGTERM handler is guarded against re-entrance (repeated Ctrl-C).
 */

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import { execaSync, type ResultPromise, execa as spawn } from "execa";
import {
  DockerComposeEnvironment,
  type StartedDockerComposeEnvironment,
  Wait,
} from "testcontainers";

import { ENSNamespaceIds } from "@ensnode/datasources";
import { OmnichainIndexingStatusIds } from "@ensnode/ensnode-sdk";

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../..");
const ENSRAINBOW_DIR = resolve(MONOREPO_ROOT, "apps/ensrainbow");
const ENSINDEXER_DIR = resolve(MONOREPO_ROOT, "apps/ensindexer");
const ENSAPI_DIR = resolve(MONOREPO_ROOT, "apps/ensapi");

// Ports
const ENSRAINBOW_PORT = 3223;
const ENSINDEXER_PORT = 42069;
const ENSAPI_PORT = 4334;

// Shared config
const ENSRAINBOW_URL = `http://localhost:${ENSRAINBOW_PORT}`;
const ENSINDEXER_SCHEMA_NAME = "ensindexer_integration_test";

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
      await composeEnvironment.down();
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
  console.log(`[ci] ${msg}`);
}

function logError(msg: string) {
  console.error(`[ci] ERROR: ${msg}`);
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
        const snapshot = await ensDbClient.getIndexingStatusSnapshot();
        if (snapshot !== undefined) {
          const omnichainStatus = snapshot.omnichainSnapshot.omnichainStatus;
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

  // Phase 1: Start Postgres + Devnet via docker-compose
  log("Starting Postgres and devnet...");
  composeEnvironment = await new DockerComposeEnvironment(MONOREPO_ROOT, "docker-compose.yml")
    .withWaitStrategy("devnet", Wait.forHealthCheck())
    .withWaitStrategy("postgres", Wait.forListeningPorts())
    .withStartupTimeout(120_000)
    .up(["postgres", "devnet"]);

  const postgresContainer = composeEnvironment.getContainer("postgres");
  const postgresPort = postgresContainer.getMappedPort(5432);
  const ENSDB_URL = `postgresql://postgres:password@localhost:${postgresPort}/postgres`;
  log(`Postgres is ready (port ${postgresPort})`);
  log("Devnet is ready");

  // Phase 2: Download ENSRainbow database and start from source
  const DB_SCHEMA_VERSION = "3";
  const LABEL_SET_ID = "ens-test-env";
  const LABEL_SET_VERSION = "0";
  const dataSubdir = `data-${LABEL_SET_ID}_${LABEL_SET_VERSION}`;
  const ensrainbowDataDir = resolve(ENSRAINBOW_DIR, "data");
  const downloadTempDir = resolve(ensrainbowDataDir, "_download_temp");

  log("Downloading ENSRainbow database...");
  execaSync(
    "bash",
    [
      `${ENSRAINBOW_DIR}/scripts/download-prebuilt-database.sh`,
      DB_SCHEMA_VERSION,
      LABEL_SET_ID,
      LABEL_SET_VERSION,
    ],
    {
      cwd: ENSRAINBOW_DIR,
      stdio: "inherit",
      env: { OUT_DIR: downloadTempDir },
    },
  );

  // Extract archive into the data directory (matches entrypoint.sh behavior)
  const archivePath = resolve(
    downloadTempDir,
    "databases",
    DB_SCHEMA_VERSION,
    `${LABEL_SET_ID}_${LABEL_SET_VERSION}.tgz`,
  );
  mkdirSync(ensrainbowDataDir, { recursive: true });
  execaSync("tar", ["-xzf", archivePath, "-C", ensrainbowDataDir, "--strip-components=1"], {
    stdio: "inherit",
  });
  log("ENSRainbow database extracted");

  log("Starting ENSRainbow...");
  spawnService(
    "pnpm",
    ["serve", "--data-dir", `data/${dataSubdir}`],
    ENSRAINBOW_DIR,
    { LOG_LEVEL: "error" },
    "ensrainbow",
  );
  await waitForHealth(`http://localhost:${ENSRAINBOW_PORT}/health`, 30_000, "ENSRainbow");

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
