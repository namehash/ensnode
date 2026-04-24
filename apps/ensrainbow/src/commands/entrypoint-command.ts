import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { serve } from "@hono/node-server";

import { stringifyConfig } from "@ensnode/ensnode-sdk/internal";
import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";

import { buildEnsRainbowPublicConfig } from "@/config/public";
import type { AbsolutePath, DbSchemaVersion } from "@/config/types";
import { createApi } from "@/lib/api";
import { ENSRainbowDB } from "@/lib/database";
import { buildDbConfig, ENSRainbowServer } from "@/lib/server";
import { closeHttpServer } from "@/utils/http-server";
import { logger } from "@/utils/logger";

/**
 * Grace period given to a spawned child process after SIGTERM before we escalate to SIGKILL
 * during shutdown.
 */
const CHILD_PROCESS_KILL_GRACE_MS = 5_000;

class BootstrapAbortedError extends Error {
  constructor() {
    super("ENSRainbow bootstrap aborted due to shutdown");
    this.name = "BootstrapAbortedError";
  }
}

export interface EntrypointCommandOptions {
  port: number;
  dataDir: AbsolutePath;
  dbSchemaVersion: DbSchemaVersion;
  labelSetId: string;
  labelSetVersion: number;
  /**
   * Temporary directory used to stage downloaded archives before extraction.
   * Defaults to `<dataDir>/.download-temp`.
   */
  downloadTempDir?: string;
  /**
   * Labelset server URL override. If unset, the download script uses its default.
   */
  labelsetServerUrl?: string | undefined;
  /**
   * Whether to register SIGTERM/SIGINT shutdown handlers. Defaults to `true`.
   * Tests should pass `false` to avoid leaking handlers across cases.
   */
  registerSignalHandlers?: boolean;
}

/**
 * Handle returned by {@link entrypointCommand} so callers (tests, embeddings) can close the
 * HTTP server and DB, and observe when the background bootstrap pipeline has finished.
 */
export interface EntrypointCommandHandle {
  /**
   * Resolves once the background bootstrap has either completed successfully or been aborted
   * during shutdown. Never rejects: on non-abort failure the process is terminated via
   * `process.exit(1)`.
   */
  readonly bootstrapComplete: Promise<void>;
  /**
   * Closes the HTTP server and attached database.
   */
  close(): Promise<void>;
}

/**
 * Name of the marker file written to `dataDir` once the database has been successfully
 * downloaded, extracted, and validated. Matches the name used by the legacy `entrypoint.sh`
 * so existing volumes remain compatible.
 */
export const DB_READY_MARKER_FILENAME = "ensrainbow_db_ready";

/**
 * Runs the full ENSRainbow container lifecycle:
 *
 * 1. Starts the Hono HTTP server immediately with an unattached database (so `/health` and
 *    `/ready` respond right away, and orchestrator health checks don't kill the container).
 * 2. Schedules a background bootstrap via `setTimeout(..., 0)` that downloads the pre-built
 *    database archive, extracts it, validates it (lite), opens LevelDB, and attaches it to the
 *    server. Any failure in this pipeline calls `process.exit(1)` so the orchestrator restarts
 *    the container.
 * 3. Wires SIGTERM/SIGINT handlers for graceful shutdown. On shutdown the bootstrap is aborted
 *    (spawned children are killed and any partially-opened LevelDB handle is released) before
 *    the HTTP server and DB-backed server are closed, so we don't leak locks or prolong exit.
 */
export async function entrypointCommand(
  options: EntrypointCommandOptions,
): Promise<EntrypointCommandHandle> {
  logger.info("ENSRainbow running with config:");
  logger.info(stringifyConfig(options, { pretty: true }));

  logger.info(
    `ENSRainbow entrypoint starting HTTP server on port ${options.port} ` +
      `(database will be bootstrapped in the background)`,
  );

  const ensRainbowServer = ENSRainbowServer.createPending();

  let cachedPublicConfig: EnsRainbow.ENSRainbowPublicConfig | null = null;
  const app = createApi(ensRainbowServer, () => cachedPublicConfig);

  const httpServer = serve({
    fetch: app.fetch,
    port: options.port,
  });

  // Shared between close() and the bootstrap pipeline. `close()` aborts this to kill any
  // in-flight spawned child processes and make the bootstrap bail out as soon as possible.
  const bootstrapAborter = new AbortController();

  // Resolves as soon as the bootstrap task has settled (success, failure, or abort). Used by
  // close() to wait for cleanup of in-flight children and partially-opened DB handles before
  // returning. Distinct from `bootstrapComplete`, which only resolves on successful bootstrap.
  let signalBootstrapSettled!: () => void;
  const bootstrapSettled = new Promise<void>((resolvePromise) => {
    signalBootstrapSettled = resolvePromise;
  });

  let alreadyClosed = false;
  const close = async () => {
    if (alreadyClosed) return;
    alreadyClosed = true;
    logger.info("Shutting down server...");
    bootstrapAborter.abort();
    try {
      // Wait for the bootstrap pipeline to settle (including spawned child cleanup and any
      // partially-opened DB being closed) before shutting down the HTTP server and DB, so
      // we don't leave child processes or LevelDB locks behind.
      await bootstrapSettled;
      await closeHttpServer(httpServer);
      await ensRainbowServer.close();
      logger.info("Server shutdown complete");
    } catch (error) {
      logger.error(error, "Error during shutdown:");
      throw error;
    }
  };

  if (options.registerSignalHandlers !== false) {
    const closeFromSignal = () => {
      // Node does not await signal handlers; never allow shutdown errors to become
      // unhandled promise rejections during process teardown.
      void close().catch(() => {});
    };

    process.once("SIGTERM", closeFromSignal);
    process.once("SIGINT", closeFromSignal);
  }

  const bootstrapComplete = new Promise<void>((resolvePromise) => {
    // Schedule the bootstrap on the next tick so the HTTP server can accept connections first.
    setTimeout(() => {
      runDbBootstrap(options, ensRainbowServer, bootstrapAborter.signal)
        .then((publicConfig) => {
          cachedPublicConfig = publicConfig;
          logger.info(
            "ENSRainbow database bootstrap complete. Service is ready to serve heal requests.",
          );
          resolvePromise();
        })
        .catch((error) => {
          if (error instanceof BootstrapAbortedError || bootstrapAborter.signal.aborted) {
            logger.info("ENSRainbow database bootstrap aborted due to shutdown");
            resolvePromise();
            return;
          }
          logger.error(error, "ENSRainbow database bootstrap failed - exiting");
          process.exit(1);
        })
        .finally(() => {
          signalBootstrapSettled();
        });
    }, 0);
  });

  return { bootstrapComplete, close };
}

/**
 * Full database bootstrap pipeline. Idempotent: if the marker file already exists and the
 * on-disk database passes lite validation, the download and extraction steps are skipped.
 *
 * Honors `signal`: between steps we check for abort and, if a DB has been opened but not yet
 * attached to the server, close it so the LevelDB lock is released promptly. Once the DB is
 * attached to `ensRainbowServer`, its close is owned by `ENSRainbowServer.close()`.
 *
 * @returns the `ENSRainbowPublicConfig` for the attached database.
 */
async function runDbBootstrap(
  options: EntrypointCommandOptions,
  ensRainbowServer: ENSRainbowServer,
  signal: AbortSignal,
): Promise<EnsRainbow.ENSRainbowPublicConfig> {
  const { dataDir, dbSchemaVersion, labelSetId, labelSetVersion } = options;
  const downloadTempDir = options.downloadTempDir ?? join(dataDir, ".download-temp");
  const markerFile = join(dataDir, DB_READY_MARKER_FILENAME);
  const dbSubdir = join(dataDir, `data-${labelSetId}_${labelSetVersion}`);

  mkdirSync(dataDir, { recursive: true });

  if (existsSync(markerFile) && existsSync(dbSubdir)) {
    logger.info(
      `Found existing ENSRainbow marker at ${markerFile}; attempting to open existing database at ${dbSubdir}`,
    );
    // Track the opened DB and whether ownership has transferred to the server so the catch
    // block below can release the correct resources before falling back to re-download.
    let existingDb: ENSRainbowDB | undefined;
    let existingDbAttached = false;
    try {
      throwIfAborted(signal);
      existingDb = await ENSRainbowDB.open(dbSubdir);
      if (signal.aborted) {
        await safeClose(existingDb);
        throw new BootstrapAbortedError();
      }
      await ensRainbowServer.attachDb(existingDb);
      existingDbAttached = true;
      return buildEnsRainbowPublicConfig(await buildDbConfig(ensRainbowServer));
    } catch (error) {
      if (error instanceof BootstrapAbortedError || signal.aborted) {
        throw error;
      }
      // Release the DB handle (so the LevelDB LOCK is freed before we re-extract into the
      // same path), and wipe the stale on-disk files so the tar re-extraction starts from a
      // clean state. If attach succeeded, ownership has transferred to the server, so route
      // the close through `ensRainbowServer.close()` which also resets its internal state so
      // the re-downloaded DB can be re-attached below.
      if (existingDbAttached) {
        try {
          await ensRainbowServer.close();
        } catch (closeError) {
          logger.warn(
            closeError,
            "Failed to close server while falling back to re-download; continuing",
          );
        }
      } else if (existingDb !== undefined) {
        await safeClose(existingDb);
      }
      rmSync(dbSubdir, { recursive: true, force: true });
      logger.warn(
        error,
        "Existing ENSRainbow database failed to open or validate; re-downloading from scratch",
      );
      // Fall through to re-download below.
    }
  }

  throwIfAborted(signal);
  await downloadAndExtractDatabase({
    dataDir,
    dbSchemaVersion,
    labelSetId,
    labelSetVersion,
    downloadTempDir,
    labelsetServerUrl: options.labelsetServerUrl,
    signal,
  });
  throwIfAborted(signal);

  logger.info(`Opening newly extracted database at ${dbSubdir}`);
  const db = await ENSRainbowDB.open(dbSubdir);
  let dbAttached = false;
  try {
    if (signal.aborted) {
      throw new BootstrapAbortedError();
    }

    await ensRainbowServer.attachDb(db);
    dbAttached = true;

    if (signal.aborted) {
      throw new BootstrapAbortedError();
    }

    // Write marker after a successful attach so restarts can skip the download step.
    await writeFile(markerFile, "");

    return buildEnsRainbowPublicConfig(await buildDbConfig(ensRainbowServer));
  } catch (error) {
    if (!dbAttached) {
      await safeClose(db);
    } else if (error instanceof BootstrapAbortedError || signal.aborted) {
      try {
        await ensRainbowServer.close();
      } catch (closeError) {
        logger.warn(
          closeError,
          "Failed to close server while aborting after DB attach; continuing",
        );
      }
    }
    throw error;
  }
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new BootstrapAbortedError();
  }
}

async function safeClose(db: ENSRainbowDB): Promise<void> {
  try {
    await db.close();
  } catch (error) {
    logger.warn(error, "Failed to close partially-opened ENSRainbow database during shutdown");
  }
}

interface DownloadAndExtractParams {
  dataDir: string;
  dbSchemaVersion: DbSchemaVersion;
  labelSetId: string;
  labelSetVersion: number;
  downloadTempDir: string;
  labelsetServerUrl?: string | undefined;
  signal: AbortSignal;
}

async function downloadAndExtractDatabase(params: DownloadAndExtractParams): Promise<void> {
  const { dataDir, dbSchemaVersion, labelSetId, labelSetVersion, downloadTempDir, signal } = params;

  // Clean up any stale state from a previous aborted bootstrap attempt.
  rmSync(downloadTempDir, { recursive: true, force: true });
  mkdirSync(downloadTempDir, { recursive: true });

  const downloadScript = resolveDownloadScriptPath();
  logger.info(
    `Downloading ENSRainbow database (schema=${dbSchemaVersion}, id=${labelSetId}, version=${labelSetVersion}) via ${downloadScript}`,
  );

  await spawnChild(
    "bash",
    [downloadScript, String(dbSchemaVersion), labelSetId, String(labelSetVersion)],
    {
      OUT_DIR: downloadTempDir,
      ...(params.labelsetServerUrl
        ? { ENSRAINBOW_LABELSET_SERVER_URL: params.labelsetServerUrl }
        : {}),
    },
    signal,
  );

  const archivePath = join(
    downloadTempDir,
    "databases",
    String(dbSchemaVersion),
    `${labelSetId}_${labelSetVersion}.tgz`,
  );
  if (!existsSync(archivePath)) {
    throw new Error(
      `Expected database archive file not found at ${archivePath} after download completed`,
    );
  }

  logger.info(`Extracting ${archivePath} into ${dataDir}`);
  mkdirSync(dataDir, { recursive: true });
  // If a previous bootstrap attempt was aborted mid-extraction, tar won't remove already-written
  // files and a partial database can remain permanently corrupt. Clear the target before extract.
  const dbSubdir = join(dataDir, `data-${labelSetId}_${labelSetVersion}`);
  rmSync(dbSubdir, { recursive: true, force: true });
  await spawnChild("tar", ["-xzf", archivePath, "-C", dataDir, "--strip-components=1"], {}, signal);

  rmSync(downloadTempDir, { recursive: true, force: true });
}

export const __TESTING__ = {
  downloadAndExtractDatabase,
};

/**
 * Resolve the absolute path to `download-prebuilt-database.sh`.
 *
 * The compiled command lives at `apps/ensrainbow/src/commands/entrypoint-command.ts` in source
 * and at `dist/commands/entrypoint-command.js` at runtime; in both cases the sibling `scripts`
 * directory is two levels up.
 */
function resolveDownloadScriptPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // From `src/commands/` or `dist/commands/` go up two levels to reach the app root.
  return resolve(here, "..", "..", "scripts", "download-prebuilt-database.sh");
}

function spawnChild(
  command: string,
  args: string[],
  extraEnv: Record<string, string>,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    if (signal.aborted) {
      reject(new BootstrapAbortedError());
      return;
    }

    const child = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env, ...extraEnv },
    });

    // On abort: send SIGTERM for a graceful exit, and escalate to SIGKILL after a grace period
    // if the child is still alive. The `unref`'d timeout ensures we don't hold the event loop
    // open if the child exits cleanly before the grace period elapses.
    let killTimer: NodeJS.Timeout | undefined;
    const onAbort = () => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      child.kill("SIGTERM");
      killTimer = setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) {
          child.kill("SIGKILL");
        }
      }, CHILD_PROCESS_KILL_GRACE_MS);
      killTimer.unref();
    };
    signal.addEventListener("abort", onAbort, { once: true });

    const cleanup = () => {
      signal.removeEventListener("abort", onAbort);
      if (killTimer) clearTimeout(killTimer);
    };

    child.on("error", (err) => {
      cleanup();
      reject(err);
    });
    child.on("exit", (code, exitSignal) => {
      cleanup();
      if (signal.aborted) {
        reject(new BootstrapAbortedError());
        return;
      }
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(
        new Error(
          `Command '${command} ${args.join(" ")}' exited with ${
            exitSignal ? `signal ${exitSignal}` : `code ${code}`
          }`,
        ),
      );
    });
  });
}
