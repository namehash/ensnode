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
import { logger } from "@/utils/logger";

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
   * Resolves once the background bootstrap has completed successfully. Never rejects: on
   * failure the process is terminated via `process.exit(1)` (or the caller's exit-like hook).
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
 * 3. Wires SIGTERM/SIGINT handlers for graceful shutdown (HTTP server + DB).
 */
export async function entrypointCommand(
  options: EntrypointCommandOptions,
): Promise<EntrypointCommandHandle> {
  console.log("ENSRainbow running with config:");
  console.log(stringifyConfig(options, { pretty: true }));

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

  let alreadyClosed = false;
  const close = async () => {
    if (alreadyClosed) return;
    alreadyClosed = true;
    logger.info("Shutting down server...");
    try {
      await httpServer.close();
      await ensRainbowServer.close();
      logger.info("Server shutdown complete");
    } catch (error) {
      logger.error(error, "Error during shutdown:");
      throw error;
    }
  };

  if (options.registerSignalHandlers !== false) {
    process.on("SIGTERM", close);
    process.on("SIGINT", close);
  }

  const bootstrapComplete = new Promise<void>((resolvePromise) => {
    // Schedule the bootstrap on the next tick so the HTTP server can accept connections first.
    setTimeout(() => {
      runDbBootstrap(options, ensRainbowServer)
        .then((publicConfig) => {
          cachedPublicConfig = publicConfig;
          logger.info(
            "ENSRainbow database bootstrap complete. Service is ready to serve heal requests.",
          );
          resolvePromise();
        })
        .catch((error) => {
          logger.error(error, "ENSRainbow database bootstrap failed - exiting");
          process.exit(1);
        });
    }, 0);
  });

  return { bootstrapComplete, close };
}

/**
 * Full database bootstrap pipeline. Idempotent: if the marker file already exists and the
 * on-disk database passes lite validation, the download and extraction steps are skipped.
 *
 * @returns the `ENSRainbowPublicConfig` for the attached database.
 */
async function runDbBootstrap(
  options: EntrypointCommandOptions,
  ensRainbowServer: ENSRainbowServer,
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
    try {
      const db = await ENSRainbowDB.open(dbSubdir);
      await ensRainbowServer.attachDb(db);
      return buildEnsRainbowPublicConfig(await buildDbConfig(ensRainbowServer));
    } catch (error) {
      logger.warn(
        error,
        "Existing ENSRainbow database failed to open or validate; re-downloading from scratch",
      );
      // Fall through to re-download below.
    }
  }

  await downloadAndExtractDatabase({
    dataDir,
    dbSchemaVersion,
    labelSetId,
    labelSetVersion,
    downloadTempDir,
    labelsetServerUrl: options.labelsetServerUrl,
  });

  logger.info(`Opening newly extracted database at ${dbSubdir}`);
  const db = await ENSRainbowDB.open(dbSubdir);

  await ensRainbowServer.attachDb(db);

  // Write marker after a successful attach so restarts can skip the download step.
  await writeFile(markerFile, "");

  return buildEnsRainbowPublicConfig(await buildDbConfig(ensRainbowServer));
}

interface DownloadAndExtractParams {
  dataDir: string;
  dbSchemaVersion: DbSchemaVersion;
  labelSetId: string;
  labelSetVersion: number;
  downloadTempDir: string;
  labelsetServerUrl?: string | undefined;
}

async function downloadAndExtractDatabase(params: DownloadAndExtractParams): Promise<void> {
  const { dataDir, dbSchemaVersion, labelSetId, labelSetVersion, downloadTempDir } = params;

  // Clean up any stale state from a previous aborted bootstrap attempt.
  rmSync(downloadTempDir, { recursive: true, force: true });
  mkdirSync(downloadTempDir, { recursive: true });

  const downloadScript = resolveDownloadScriptPath();
  logger.info(
    `Downloading ENSRainbow database (schema=${dbSchemaVersion}, id=${labelSetId}, version=${labelSetVersion}) via ${downloadScript}`,
  );

  await spawnChild(
    "bash",
    [
      downloadScript,
      String(dbSchemaVersion),
      labelSetId,
      String(labelSetVersion),
    ],
    {
      OUT_DIR: downloadTempDir,
      ...(params.labelsetServerUrl
        ? { ENSRAINBOW_LABELSET_SERVER_URL: params.labelsetServerUrl }
        : {}),
    },
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
  await spawnChild("tar", ["-xzf", archivePath, "-C", dataDir, "--strip-components=1"], {});

  rmSync(downloadTempDir, { recursive: true, force: true });
}

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
): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env, ...extraEnv },
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(
        new Error(
          `Command '${command} ${args.join(" ")}' exited with ${
            signal ? `signal ${signal}` : `code ${code}`
          }`,
        ),
      );
    });
  });
}
