import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer, type StartedTestContainer, Wait } from "testcontainers";

import { ENSNamespaceIds } from "@ensnode/datasources";
import { OmnichainIndexingStatusIds } from "@ensnode/ensnode-sdk";

const MONOREPO_ROOT = resolve(import.meta.dirname, "../../..");
const ENSRAINBOW_DIR = resolve(MONOREPO_ROOT, "apps/ensrainbow");
const ENSINDEXER_DIR = resolve(MONOREPO_ROOT, "apps/ensindexer");
const ENSAPI_DIR = resolve(MONOREPO_ROOT, "apps/ensapi");

// Docker images
const POSTGRES_IMAGE = "postgres:17";
const DEVNET_IMAGE = "ghcr.io/ensdomains/contracts-v2:main-f476641";

// Ports (devnet ports must be fixed — ensTestEnvChain hardcodes localhost:8545)
const DEVNET_RPC_PORT = 8545;
const DEVNET_HEALTH_PORT = 8000;
const ENSRAINBOW_PORT = 3223;
const ENSINDEXER_PORT = 42069;
const ENSAPI_PORT = 4334;

// Shared config
const ENSINDEXER_URL = `http://localhost:${ENSINDEXER_PORT}`;
const ENSRAINBOW_URL = `http://localhost:${ENSRAINBOW_PORT}`;

// Track resources for cleanup
const childProcesses: ChildProcess[] = [];
const containers: (StartedTestContainer | StartedPostgreSqlContainer)[] = [];

// Abort flag — set when a spawned service crashes after health check
let aborted = false;
let abortReason = "";

function checkAborted() {
  if (aborted) {
    throw new Error(`Aborting: ${abortReason}`);
  }
}

function waitForExit(child: ChildProcess, timeoutMs: number): Promise<void> {
  return new Promise<void>((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve();
    child.on("exit", () => resolve());
    setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {}
      resolve();
    }, timeoutMs);
  });
}

async function cleanup() {
  // Stop child processes in reverse order (ensapi → ensindexer → ensrainbow)
  // so DB consumers disconnect before containers are stopped
  for (const child of [...childProcesses].reverse()) {
    try {
      child.kill("SIGTERM");
    } catch {}
    await waitForExit(child, 10_000);
  }

  for (const container of containers) {
    try {
      await container.stop();
    } catch {}
  }
}

process.on("SIGINT", async () => {
  await cleanup();
  process.exit(1);
});
process.on("SIGTERM", async () => {
  await cleanup();
  process.exit(1);
});

function log(msg: string) {
  console.log(`[ci] ${msg}`);
}

function logError(msg: string) {
  console.error(`[ci] ERROR: ${msg}`);
}

async function waitForHealth(url: string, timeoutMs: number, label: string): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    checkAborted();
    try {
      const res = await fetch(url);
      if (res.ok) {
        log(`${label} is healthy`);
        return;
      }
      log(`${label} health check returned ${res.status}, retrying...`);
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${label} did not become healthy within ${timeoutMs / 1000}s`);
}

function spawnService(
  command: string,
  args: string[],
  cwd: string,
  env: Record<string, string>,
  label: string,
): ChildProcess {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (data: Buffer) => {
    for (const line of data.toString().split("\n").filter(Boolean)) {
      console.log(`[${label}] ${line}`);
    }
  });

  child.stderr?.on("data", (data: Buffer) => {
    for (const line of data.toString().split("\n").filter(Boolean)) {
      console.error(`[${label}] ${line}`);
    }
  });

  child.on("error", (err) => {
    logError(`${label} failed to start: ${err.message}`);
    aborted = true;
    abortReason = `${label} failed to start: ${err.message}`;
  });

  child.on("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      logError(`${label} exited with code ${code}`);
      aborted = true;
      abortReason = `${label} exited with code ${code}`;
    } else if (code === null && signal !== null) {
      logError(`${label} was killed by signal ${signal}`);
      aborted = true;
      abortReason = `${label} was killed by signal ${signal}`;
    }
  });

  childProcesses.push(child);
  return child;
}

async function pollIndexingStatus(timeoutMs: number): Promise<void> {
  const client = new (await import("@ensnode/ensnode-sdk")).EnsIndexerClient({
    url: new URL(ENSINDEXER_URL),
  });

  const start = Date.now();
  log("Polling indexing status...");

  while (Date.now() - start < timeoutMs) {
    checkAborted();
    try {
      const status = await client.indexingStatus();
      if (status.responseCode === "ok") {
        const omnichainStatus =
          status.realtimeProjection.snapshot.omnichainSnapshot.omnichainStatus;
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
}

async function main() {
  log("Starting integration test environment...");

  // Phase 1: Start Postgres + Devnet in parallel
  log("Starting Postgres and devnet...");
  const [postgres, devnet] = await Promise.all([
    new PostgreSqlContainer(POSTGRES_IMAGE)
      .withDatabase("ensnode")
      .withUsername("postgres")
      .withPassword("password")
      .start(),
    new GenericContainer(DEVNET_IMAGE)
      .withEnvironment({ ANVIL_IP_ADDR: "0.0.0.0" })
      .withExposedPorts(
        { container: DEVNET_RPC_PORT, host: DEVNET_RPC_PORT },
        { container: DEVNET_HEALTH_PORT, host: DEVNET_HEALTH_PORT },
      )
      .withCommand(["./script/runDevnet.ts", "--testNames"])
      .withStartupTimeout(120_000)
      .withWaitStrategy(Wait.forHttp("/health", DEVNET_HEALTH_PORT))
      .start(),
  ]);
  containers.push(postgres, devnet);
  const DATABASE_URL = postgres.getConnectionUri();
  log(`Postgres is ready (port ${postgres.getPort()})`);
  log("Devnet is ready");

  // Phase 2: Download ENSRainbow database and start from source
  const LABEL_SET_ID = "ens-test-env";
  const LABEL_SET_VERSION = "0";
  const DB_SCHEMA_VERSION = "3";
  const dataSubdir = `data-${LABEL_SET_ID}_${LABEL_SET_VERSION}`;
  const ensrainbowDataDir = resolve(ENSRAINBOW_DIR, "data");
  const downloadTempDir = resolve(ensrainbowDataDir, "_download_temp");

  log("Downloading ENSRainbow database...");
  execFileSync(
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
      env: { ...process.env, OUT_DIR: downloadTempDir },
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
  execFileSync("tar", ["-xzf", archivePath, "-C", ensrainbowDataDir], {
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
      DATABASE_URL,
      DATABASE_SCHEMA: "public",
      PLUGINS: "ensv2,protocol-acceleration",
      ENSRAINBOW_URL,
      ENSINDEXER_URL,
      LABEL_SET_ID: "ens-test-env",
      LABEL_SET_VERSION: "0",
    },
    "ensindexer",
  );
  await waitForHealth(`http://localhost:${ENSINDEXER_PORT}/health`, 60_000, "ENSIndexer");

  // Phase 4: Wait for indexing to complete
  await pollIndexingStatus(30_000);

  // Phase 5: Start ENSApi
  log("Starting ENSApi...");
  spawnService(
    "pnpm",
    ["start"],
    ENSAPI_DIR,
    {
      ENSINDEXER_URL,
      DATABASE_URL,
    },
    "ensapi",
  );
  await waitForHealth(`http://localhost:${ENSAPI_PORT}/health`, 10_000, "ENSApi");

  // Phase 6: Run integration tests
  log("Running integration tests...");
  execFileSync("pnpm", ["test:integration"], {
    cwd: MONOREPO_ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      ENSAPI_GRAPHQL_API_URL: `http://localhost:${ENSAPI_PORT}/api/graphql`,
    },
  });
  log("Integration tests passed!");

  await cleanup();
}

main().catch(async (e: unknown) => {
  logError(String(e));
  await cleanup();
  process.exitCode = 1;
});
