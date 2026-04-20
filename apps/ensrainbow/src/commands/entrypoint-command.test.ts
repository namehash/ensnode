import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { buildLabelSetId, buildLabelSetVersion } from "@ensnode/ensnode-sdk";
import type { EnsRainbow } from "@ensnode/ensrainbow-sdk";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AbsolutePath, DbSchemaVersion } from "@/config/types";
import { DB_SCHEMA_VERSION, ENSRainbowDB } from "@/lib/database";
import { DbNotReadyError, ENSRainbowServer } from "@/lib/server";

import {
  DB_READY_MARKER_FILENAME,
  type EntrypointCommandHandle,
  entrypointCommand,
} from "./entrypoint-command";

/**
 * These tests exercise the idempotent bootstrap path of the entrypoint command, where the marker
 * file and a valid on-disk database already exist. We do not exercise the actual download script
 * here (it requires network + a labelset server).
 */
describe("entrypointCommand (existing DB on disk)", () => {
  const testDataDir = resolve(process.cwd(), "test-data-entrypoint");
  const labelSetId = buildLabelSetId("entrypoint-test");
  const labelSetVersion = buildLabelSetVersion(0);
  const dbSubdir = join(testDataDir, `data-${labelSetId}_${labelSetVersion}`);
  const markerFile = join(testDataDir, DB_READY_MARKER_FILENAME);
  const port = 3226;
  const endpoint = `http://localhost:${port}`;

  let handle: EntrypointCommandHandle | undefined;

  beforeEach(async () => {
    await rm(testDataDir, { recursive: true, force: true });
    await mkdir(testDataDir, { recursive: true });

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
    const readyRes = await fetch(`${endpoint}/ready`);
    expect(readyRes.status).toBe(503);
    
    await handle.bootstrapComplete;

    const readyRes2 = await fetch(`${endpoint}/ready`);
    expect(readyRes2.status).toBe(200);

    const configRes = await fetch(`${endpoint}/v1/config`);
    expect(configRes.status).toBe(200);
    const configData = (await configRes.json()) as EnsRainbow.ENSRainbowPublicConfig;
    expect(configData.labelSet.labelSetId).toBe(labelSetId);
    expect(configData.recordsCount).toBe(0);

    // Marker should still be present after a successful idempotent attach.
    expect(existsSync(markerFile)).toBe(true);
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

