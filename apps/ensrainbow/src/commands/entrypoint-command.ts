import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { serve } from "@hono/node-server";

import type { EnsRainbowServerLabelSet } from "@ensnode/ensnode-sdk";
import { stringifyConfig } from "@ensnode/ensnode-sdk/internal";

import { buildEnsRainbowPublicConfigFromLabelSet } from "@/config/public";
import type { AbsolutePath, DbConfig, DbSchemaVersion } from "@/config/types";
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
  /**
   * Hook used to terminate the process on fatal bootstrap errors (download failure or
   * env-vs-DB label-set mismatch). Defaults to `process.exit`. Tests can override this
   * to assert termination without actually killing the test runner.
   */
  exit?: (code: number) => void;
}

/**
 * Handle returned by {@link entrypointCommand}.
 */
export interface EntrypointCommandHandle {
  /**
   * Resolves when bootstrap finishes or is aborted by shutdown.
   * Never rejects: non-abort failures terminate the process via `options.exit(1)`
   * (defaults to `process.exit(1)`).
   */
  readonly bootstrapComplete: Promise<void>;
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

  // Public config from CLI/env so `/v1/config` works before attach; validated against DB after bootstrap.
  const argsServerLabelSet: EnsRainbowServerLabelSet = {
    labelSetId: options.labelSetId,
    highestLabelSetVersion: options.labelSetVersion,
  };
  const inMemoryPublicConfig = buildEnsRainbowPublicConfigFromLabelSet(argsServerLabelSet);

  let cachedDbConfig: DbConfig | null = null;
  const app = createApi(ensRainbowServer, inMemoryPublicConfig, () => cachedDbConfig);

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

  // Track signal listeners so close() can detach them when invoked programmatically
  // (e.g., from tests). `process.once` only auto-removes after firing, so a manual close()
  // would otherwise leak listeners until the process receives a signal.
  let signalHandler: (() => void) | undefined;

  // Cache the in-flight shutdown so all callers (signal handler, programmatic close()) await
  // the same work. A boolean guard would let later callers resolve immediately while the
  // first close() is still tearing down resources.
  let closePromise: Promise<void> | undefined;
  const close = (): Promise<void> => {
    if (closePromise) return closePromise;

    closePromise = (async () => {
      logger.info("Shutting down server...");

      if (signalHandler) {
        process.removeListener("SIGTERM", signalHandler);
        process.removeListener("SIGINT", signalHandler);
        signalHandler = undefined;
      }

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
    })();

    return closePromise;
  };

  if (options.registerSignalHandlers !== false) {
    signalHandler = () => {
      // Node does not await signal handlers; swallow errors to avoid unhandled rejections.
      void close().catch(() => {});
    };

    process.once("SIGTERM", signalHandler);
    process.once("SIGINT", signalHandler);
  }

  const exit = options.exit ?? ((code: number) => process.exit(code));
  let exitRequested = false;
  const requestExit = (code: number) => {
    exitRequested = true;
    try {
      exit(code);
    } catch (_error) {
      // Tests may throw from a custom exit hook to short-circuit control flow.
      // Swallow to avoid this surfacing as a bootstrap failure.
    }
  };

  const bootstrapComplete = new Promise<void>((resolvePromise) => {
    // Defer bootstrap so the HTTP server starts accepting requests first.
    setTimeout(() => {
      runDbBootstrap(options, ensRainbowServer, bootstrapAborter.signal)
        .then((dbConfig) => {
          if (
            dbConfig.serverLabelSet.labelSetId !== argsServerLabelSet.labelSetId ||
            dbConfig.serverLabelSet.highestLabelSetVersion !==
              argsServerLabelSet.highestLabelSetVersion
          ) {
            logger.error(
              `ENSRainbow database label set ` +
                `${dbConfig.serverLabelSet.labelSetId}@${dbConfig.serverLabelSet.highestLabelSetVersion} ` +
                `does not match the configured ` +
                `LABEL_SET_ID=${argsServerLabelSet.labelSetId} / ` +
                `LABEL_SET_VERSION=${argsServerLabelSet.highestLabelSetVersion}. ` +
                `Refusing to serve a misconfigured database; please reconcile the env/CLI ` +
                `arguments with the database in the data directory and restart.`,
            );
            resolvePromise();
            requestExit(1);
            return;
          }

          cachedDbConfig = dbConfig;
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
          if (exitRequested) {
            resolvePromise();
            return;
          }
          logger.error(error, "ENSRainbow database bootstrap failed - exiting");
          resolvePromise();
          requestExit(1);
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
 * Returns the {@link DbConfig} read from the attached DB.
 */
async function runDbBootstrap(
  options: EntrypointCommandOptions,
  ensRainbowServer: ENSRainbowServer,
  signal: AbortSignal,
): Promise<DbConfig> {
  const { dataDir, dbSchemaVersion, labelSetId, labelSetVersion } = options;
  const downloadTempDir = options.downloadTempDir ?? join(dataDir, ".download-temp");
  const markerFile = join(dataDir, DB_READY_MARKER_FILENAME);
  const dbSubdir = join(dataDir, `data-${labelSetId}_${labelSetVersion}`);

  await mkdir(dataDir, { recursive: true });

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
      throwIfAborted(signal);
      await ensRainbowServer.attachDb(existingDb);
      existingDbAttached = true;
      return await buildDbConfig(ensRainbowServer);
    } catch (error) {
      // Always release any opened DB handle/lock first, even when aborting. This prevents
      // a leaked LevelDB lock when SIGTERM races a non-abort failure (e.g. attachDb throws
      // while signal.aborted has just become true), since the previous abort-first rethrow
      // skipped cleanup entirely.
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

      if (error instanceof BootstrapAbortedError || signal.aborted) {
        throw error;
      }

      await rm(dbSubdir, { recursive: true, force: true });
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

    return await buildDbConfig(ensRainbowServer);
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

  // Clean stale state from previous aborted attempts. Async fs ops keep the event loop
  // responsive so /health and /ready continue to answer probes during heavy disk I/O.
  await rm(downloadTempDir, { recursive: true, force: true });
  await mkdir(downloadTempDir, { recursive: true });

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
  await mkdir(dataDir, { recursive: true });
  // Ensure extraction target is clean; tar does not delete stale partial files.
  const dbSubdir = join(dataDir, `data-${labelSetId}_${labelSetVersion}`);
  await rm(dbSubdir, { recursive: true, force: true });
  await spawnChild("tar", ["-xzf", archivePath, "-C", dataDir, "--strip-components=1"], {}, signal);

  await rm(downloadTempDir, { recursive: true, force: true });
}

export const __TESTING__ = {
  downloadAndExtractDatabase,
};

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
