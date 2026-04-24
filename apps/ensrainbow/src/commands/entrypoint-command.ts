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
 * Handle returned by {@link entrypointCommand}.
 */
export interface EntrypointCommandHandle {
  /**
   * Resolves when bootstrap finishes or is aborted by shutdown.
   * Never rejects: non-abort failures terminate the process via `process.exit(1)`.
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
 * Starts HTTP immediately, bootstraps DB in the background, and wires graceful shutdown.
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

  // Shared abort signal for `close()` and bootstrap work.
  const bootstrapAborter = new AbortController();

  // Tracks bootstrap task settlement so `close()` can await cleanup.
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
    // Wait for bootstrap cleanup before closing shared resources.
    await bootstrapSettled;

    let shutdownError: unknown;

    try {
      await closeHttpServer(httpServer);
    } catch (error) {
      shutdownError = error;
      logger.error(error, "Failed to close HTTP server during shutdown");
    }

    try {
      await ensRainbowServer.close();
    } catch (error) {
      if (shutdownError === undefined) {
        shutdownError = error;
      }
      logger.error(error, "Failed to close ENSRainbow server/database during shutdown");
    }

    if (shutdownError !== undefined) {
      throw shutdownError;
    }

    logger.info("Server shutdown complete");
  };

  if (options.registerSignalHandlers !== false) {
    const closeFromSignal = () => {
      // Node does not await signal handlers; swallow errors to avoid unhandled rejections.
      void close().catch(() => {});
    };

    process.once("SIGTERM", closeFromSignal);
    process.once("SIGINT", closeFromSignal);
  }

  const bootstrapComplete = new Promise<void>((resolvePromise) => {
    // Defer bootstrap so the HTTP server starts accepting requests first.
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
 * Idempotent DB bootstrap pipeline.
 *
 * If marker + DB are present, reuse them; otherwise download + extract.
 * Returns the public config for the attached DB.
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
    // Track DB ownership so cleanup chooses the correct close path.
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
      // Ensure LevelDB lock is released before fallback re-extract.
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
      // Fall through to re-download.
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

    // Write marker only after a successful attach.
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

  // Clean stale state from previous aborted attempts.
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
  // Ensure extraction target is clean; tar does not delete stale partial files.
  const dbSubdir = join(dataDir, `data-${labelSetId}_${labelSetVersion}`);
  rmSync(dbSubdir, { recursive: true, force: true });
  await spawnChild("tar", ["-xzf", archivePath, "-C", dataDir, "--strip-components=1"], {}, signal);

  rmSync(downloadTempDir, { recursive: true, force: true });
}

export const __TESTING__ = {
  downloadAndExtractDatabase,
};

/**
 * Resolve absolute path to `download-prebuilt-database.sh`.
 */
function resolveDownloadScriptPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // From `src/commands` or `dist/commands`, go up two levels to app root.
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

    // On abort: SIGTERM first, then SIGKILL after a grace period.
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
