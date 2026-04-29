import { EventEmitter } from "node:events";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildLabelSetId, buildLabelSetVersion } from "@ensnode/ensnode-sdk";
import { type EnsRainbow, StatusCode } from "@ensnode/ensrainbow-sdk";

import type { AbsolutePath, DbSchemaVersion } from "@/config/types";
import { DB_SCHEMA_VERSION, ENSRainbowDB } from "@/lib/database";
import { DbNotReadyError, ENSRainbowServer } from "@/lib/server";

let closeHttpServerImpl: undefined | ((server: unknown) => Promise<void>);
vi.mock("@/utils/http-server", async () => {
  const actual = await vi.importActual<typeof import("@/utils/http-server")>("@/utils/http-server");
  return {
    ...actual,
    closeHttpServer: async (server: unknown) => {
      if (closeHttpServerImpl) return closeHttpServerImpl(server);
      return actual.closeHttpServer(server as never);
    },
  };
});

import {
  __TESTING__,
  DB_READY_MARKER_FILENAME,
  type EntrypointCommandHandle,
  entrypointCommand,
} from "./entrypoint-command";

let spawnImpl:
  | undefined
  | ((
      command: string,
      args: string[],
      options: { stdio: "inherit"; env: Record<string, string> },
    ) => any);

vi.mock("node:child_process", () => {
  return {
    spawn: (
      command: string,
      args: string[],
      options: { stdio: "inherit"; env: Record<string, string> },
    ) => {
      if (!spawnImpl) {
        throw new Error("spawnImpl not set in test");
      }
      return spawnImpl(command, args, options);
    },
  };
});

/**
 * These tests exercise the idempotent bootstrap path of the entrypoint command, where the marker
 * file and a valid on-disk database already exist. We do not exercise the actual download script
 * here (it requires network + a labelset server).
 */
describe("entrypointCommand (existing DB on disk)", () => {
  const labelSetId = buildLabelSetId("entrypoint-test");
  const labelSetVersion = buildLabelSetVersion(0);
  const port = 3226;
  const endpoint = `http://localhost:${port}`;

  let testDataDir: string;
  let markerFile: string;
  let handle: EntrypointCommandHandle | undefined;

  beforeEach(async () => {
    testDataDir = await mkdtemp(join(tmpdir(), "ensrainbow-test-entrypoint-"));
    const dbSubdir = join(testDataDir, `data-${labelSetId}_${labelSetVersion}`);
    markerFile = join(testDataDir, DB_READY_MARKER_FILENAME);

    // Seed a valid-looking database and marker so the entrypoint skips the download step.
    const db = await ENSRainbowDB.create(dbSubdir);
    await db.setPrecalculatedRainbowRecordCount(0);
    await db.markIngestionFinished();
    await db.setLabelSetId(labelSetId);
    await db.setHighestLabelSetVersion(labelSetVersion);
    await db.close();

    await writeFile(markerFile, "");
  });

  afterEach(async () => {
    if (handle) {
      await handle.close();
      handle = undefined;
    }
    await rm(testDataDir, { recursive: true, force: true });
  });

  it("starts the HTTP server immediately and marks /ready after attaching the existing DB", async () => {
    handle = await entrypointCommand({
      port,
      dataDir: testDataDir as AbsolutePath,
      dbSchemaVersion: DB_SCHEMA_VERSION as DbSchemaVersion,
      labelSetId,
      labelSetVersion,
      registerSignalHandlers: false,
    });

    // /health should respond as soon as entrypointCommand returns (HTTP server is already bound).
    const healthRes = await fetch(`${endpoint}/health`);
    expect(healthRes.status).toBe(200);
    const healthData = (await healthRes.json()) as EnsRainbow.HealthResponse;
    expect(healthData).toEqual({ status: "ok" });
    await handle.bootstrapComplete;

    const readyRes = await fetch(`${endpoint}/ready`);
    expect(readyRes.status).toBe(200);

    const configRes = await fetch(`${endpoint}/v1/config`);
    expect(configRes.status).toBe(200);
    const configData = (await configRes.json()) as EnsRainbow.ENSRainbowPublicConfig;
    expect(configData.serverLabelSet.labelSetId).toBe(labelSetId);
    expect(configData.serverLabelSet.highestLabelSetVersion).toBe(labelSetVersion);

    const countRes = await fetch(`${endpoint}/v1/labels/count`);
    expect(countRes.status).toBe(200);
    const countData = (await countRes.json()) as EnsRainbow.CountResponse;
    expect(countData).toMatchObject({ status: StatusCode.Success, count: 0 });

    // Marker should still be present after a successful idempotent attach.
    expect(existsSync(markerFile)).toBe(true);
  });
});

describe("entrypointCommand (signal handlers)", () => {
  const labelSetId = buildLabelSetId("entrypoint-signal-test");
  const labelSetVersion = buildLabelSetVersion(0);
  const port = 3227;

  let testDataDir: string;

  beforeEach(async () => {
    testDataDir = await mkdtemp(join(tmpdir(), "ensrainbow-test-entrypoint-signals-"));
    const dbSubdir = join(testDataDir, `data-${labelSetId}_${labelSetVersion}`);
    const markerFile = join(testDataDir, DB_READY_MARKER_FILENAME);

    const db = await ENSRainbowDB.create(dbSubdir);
    await db.setPrecalculatedRainbowRecordCount(0);
    await db.markIngestionFinished();
    await db.setLabelSetId(labelSetId);
    await db.setHighestLabelSetVersion(labelSetVersion);
    await db.close();

    await writeFile(markerFile, "");
  });

  afterEach(async () => {
    closeHttpServerImpl = undefined;
    await rm(testDataDir, { recursive: true, force: true });
  });

  it("wraps SIGTERM/SIGINT handlers so shutdown failures don't become unhandled rejections", async () => {
    closeHttpServerImpl = async () => {
      throw new Error("closeHttpServer failed");
    };

    let sigtermHandler: undefined | (() => void);
    const onceSpy = vi.spyOn(process, "once").mockImplementation(((
      event: string,
      listener: (...args: any[]) => void,
    ) => {
      if (event === "SIGTERM") sigtermHandler = listener as () => void;
      // Delegate to the original implementation so other listeners still work.
      return EventEmitter.prototype.once.call(process, event, listener);
    }) as typeof process.once);

    const unhandledRejection = vi.fn();
    process.once("unhandledRejection", unhandledRejection);

    let localHandle: EntrypointCommandHandle | undefined;
    try {
      localHandle = await entrypointCommand({
        port,
        dataDir: testDataDir as AbsolutePath,
        dbSchemaVersion: DB_SCHEMA_VERSION as DbSchemaVersion,
        labelSetId,
        labelSetVersion,
        // Leave registerSignalHandlers enabled (default true)
      });

      expect(sigtermHandler).toBeTypeOf("function");
      sigtermHandler?.();
      // Ensure shutdown chain has settled before asserting on unhandled rejections.
      await localHandle.close().catch(() => {});

      expect(unhandledRejection).not.toHaveBeenCalled();
    } finally {
      process.removeListener("unhandledRejection", unhandledRejection);
      onceSpy.mockRestore();
      if (localHandle) {
        await localHandle.close().catch(() => {});
      }
    }
  });
});

describe("ENSRainbowServer (pending state smoke test)", () => {
  it("createPending returns a server with isReady() === false and heal throwing DbNotReadyError", async () => {
    const server = ENSRainbowServer.createPending();

    expect(server.isReady()).toBe(false);
    expect(server.serverLabelSet).toBeUndefined();

    await expect(
      server.heal("0x0000000000000000000000000000000000000000000000000000000000000000", {
        labelSetId: undefined,
      }),
    ).rejects.toBeInstanceOf(DbNotReadyError);
  });
});

describe("downloadAndExtractDatabase (stale dbSubdir cleanup)", () => {
  const dbSchemaVersion = DB_SCHEMA_VERSION as DbSchemaVersion;
  const labelSetId = buildLabelSetId("entrypoint-extract-test");
  const labelSetVersion = buildLabelSetVersion(0);

  let testDataDir: string;
  let downloadTempDir: string;
  let dbSubdir: string;

  beforeEach(async () => {
    testDataDir = await mkdtemp(join(tmpdir(), "ensrainbow-test-entrypoint-extract-"));
    downloadTempDir = join(testDataDir, ".download-temp");
    dbSubdir = join(testDataDir, `data-${labelSetId}_${labelSetVersion}`);
    await mkdir(dbSubdir, { recursive: true });
    await writeFile(join(dbSubdir, "STALE_FILE"), "stale");
  });

  afterEach(async () => {
    await rm(testDataDir, { recursive: true, force: true });
  });

  it("removes existing dbSubdir before spawning tar", async () => {
    let tarSawDbSubdir = true;
    spawnImpl = (command: string) => {
      const child = new EventEmitter() as any;
      child.exitCode = null;
      child.signalCode = null;
      child.kill = () => true;

      queueMicrotask(async () => {
        try {
          if (command === "bash") {
            const archivePath = join(
              downloadTempDir,
              "databases",
              String(dbSchemaVersion),
              `${labelSetId}_${labelSetVersion}.tgz`,
            );
            await mkdir(dirname(archivePath), { recursive: true });
            await writeFile(archivePath, "not-a-real-tarball");
          } else if (command === "tar") {
            tarSawDbSubdir = existsSync(dbSubdir);
          }

          child.exitCode = 0;
          child.emit("exit", 0, null);
        } catch (error) {
          child.emit("error", error);
        }
      });

      return child;
    };

    await __TESTING__.downloadAndExtractDatabase({
      dataDir: testDataDir,
      dbSchemaVersion,
      labelSetId,
      labelSetVersion,
      downloadTempDir,
      signal: new AbortController().signal,
    });

    expect(tarSawDbSubdir).toBe(false);
  });
});
