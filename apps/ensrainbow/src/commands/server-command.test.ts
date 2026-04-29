import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { serve } from "@hono/node-server";
import { asLiteralLabel, labelhashLiteralLabel } from "enssdk";
import type { Hono } from "hono";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { type EnsRainbow, ErrorCode, StatusCode } from "@ensnode/ensrainbow-sdk";

import { buildEnsRainbowPublicConfig } from "@/config/public";
import { createApi } from "@/lib/api";
import { ENSRainbowDB } from "@/lib/database";
import { buildDbConfig, ENSRainbowServer } from "@/lib/server";
import { closeHttpServer } from "@/utils/http-server";

describe("Server Command Tests", () => {
  let db: ENSRainbowDB;
  const nonDefaultPort = 3224;
  let app: Hono;
  let server: ReturnType<typeof serve>;
  const TEST_DB_DIR = "test-data-server";

  beforeAll(async () => {
    // Clean up any existing test database
    await fs.rm(TEST_DB_DIR, { recursive: true, force: true });

    try {
      db = await ENSRainbowDB.create(TEST_DB_DIR);

      // Initialize precalculated rainbow record count to be able to start server
      await db.setPrecalculatedRainbowRecordCount(0);
      await db.markIngestionFinished();
      await db.setLabelSetId("test-label-set-id");
      await db.setHighestLabelSetVersion(0);

      const ensRainbowServer = await ENSRainbowServer.init(db);
      const dbConfig = await buildDbConfig(ensRainbowServer);
      const publicConfig = buildEnsRainbowPublicConfig(dbConfig);
      app = createApi(
        ensRainbowServer,
        () => publicConfig,
        () => dbConfig,
      );

      // Start the server on a different port than what ENSRainbow defaults to
      server = serve({
        fetch: app.fetch,
        port: nonDefaultPort,
      });
    } catch (error) {
      // Ensure cleanup if setup fails
      await fs.rm(TEST_DB_DIR, { recursive: true, force: true });
      throw error;
    }
  });

  beforeEach(async () => {
    // Clear database before each test
    await db.clear();
  });

  afterAll(async () => {
    // Cleanup
    try {
      if (server) await closeHttpServer(server);
      if (db) await db.close();
      await fs.rm(TEST_DB_DIR, { recursive: true, force: true });
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  });

  describe("GET /v1/heal/:labelHash", () => {
    it("should return the label for a valid labelHash", async () => {
      const validLabel = asLiteralLabel("test-label");
      const validLabelHash = labelhashLiteralLabel(validLabel);

      // Add test data
      await db.addRainbowRecord(validLabel, 0);

      const response = await fetch(`http://localhost:${nonDefaultPort}/v1/heal/${validLabelHash}`);
      expect(response.status).toBe(200);
      const data = (await response.json()) as EnsRainbow.HealResponse;
      const expectedData: EnsRainbow.HealSuccess = {
        status: StatusCode.Success,
        label: validLabel,
      };
      expect(data).toEqual(expectedData);
    });

    it("should handle missing labelHash parameter", async () => {
      const response = await fetch(`http://localhost:${nonDefaultPort}/v1/heal/`);
      expect(response.status).toBe(404); // Hono returns 404 for missing parameters
      const text = await response.text();
      expect(text).toBe("404 Not Found"); // Hono's default 404 response
    });

    it("should reject invalid labelHash format", async () => {
      const response = await fetch(`http://localhost:${nonDefaultPort}/v1/heal/invalid-hash`);
      expect(response.status).toBe(400);
      const data = (await response.json()) as EnsRainbow.HealResponse;
      const expectedData: EnsRainbow.HealError = {
        status: StatusCode.Error,
        error: "Invalid labelHash length 12 characters (expected 66)",
        errorCode: ErrorCode.BadRequest,
      };
      expect(data).toEqual(expectedData);
    });

    it("should handle non-existent labelHash", async () => {
      const nonExistentHash = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      const response = await fetch(`http://localhost:${nonDefaultPort}/v1/heal/${nonExistentHash}`);
      expect(response.status).toBe(404);
      const data = (await response.json()) as EnsRainbow.HealResponse;
      const expectedData: EnsRainbow.HealError = {
        status: StatusCode.Error,
        error: "Label not found",
        errorCode: ErrorCode.NotFound,
      };
      expect(data).toEqual(expectedData);
    });
  });

  describe("GET /health", () => {
    it("should return ok status", async () => {
      const response = await fetch(`http://localhost:${nonDefaultPort}/health`);
      expect(response.status).toBe(200);
      const data = await response.json();
      const expectedData: EnsRainbow.HealthResponse = {
        status: "ok",
      };
      expect(data).toEqual(expectedData);
    });
  });

  describe("GET /ready", () => {
    it("should return ok status when the server has an attached database", async () => {
      const response = await fetch(`http://localhost:${nonDefaultPort}/ready`);
      expect(response.status).toBe(200);
      const data = (await response.json()) as EnsRainbow.ReadyResponse;
      expect(data).toEqual({ status: "ok" } satisfies EnsRainbow.ReadyResponse);
    });
  });

  describe("GET /v1/labels/count", () => {
    it("should return count snapshot from startup (from dbConfig.recordsCount)", async () => {
      // Count is fixed at server start; changing the DB does not affect the response
      await db.setPrecalculatedRainbowRecordCount(42);

      const response = await fetch(`http://localhost:${nonDefaultPort}/v1/labels/count`);
      expect(response.status).toBe(200);
      const data = (await response.json()) as EnsRainbow.CountResponse;
      const expectedData: EnsRainbow.CountSuccess = {
        status: StatusCode.Success,
        count: 0,
        timestamp: expect.any(String),
      };
      expect(data).toEqual(expectedData);
      expect(() => new Date(data.timestamp as string)).not.toThrow();
    });
  });

  describe("GET /v1/config", () => {
    it("should return config snapshot from startup", async () => {
      // The config is built once on startup with count = 0 (set in beforeAll)
      // Even if the database is cleared in beforeEach, the same config is returned
      const response = await fetch(`http://localhost:${nonDefaultPort}/v1/config`);
      expect(response.status).toBe(200);
      const data = (await response.json()) as EnsRainbow.ENSRainbowPublicConfig;

      expect(typeof data.versionInfo.ensRainbow).toBe("string");
      expect(data.versionInfo.ensRainbow.length).toBeGreaterThan(0);
      expect(data.serverLabelSet.labelSetId).toBe("test-label-set-id");
      expect(data.serverLabelSet.highestLabelSetVersion).toBe(0);
    });

    it("should return same config even if database count changes", async () => {
      // Set a different count in the database
      // However, the config is built once on startup, so it will still return the startup value
      await db.setPrecalculatedRainbowRecordCount(42);

      const response = await fetch(`http://localhost:${nonDefaultPort}/v1/config`);
      expect(response.status).toBe(200);
      const data = (await response.json()) as EnsRainbow.ENSRainbowPublicConfig;

      expect(typeof data.versionInfo.ensRainbow).toBe("string");
      expect(data.versionInfo.ensRainbow.length).toBeGreaterThan(0);
      expect(data.serverLabelSet.labelSetId).toBe("test-label-set-id");
      expect(data.serverLabelSet.highestLabelSetVersion).toBe(0);
    });
  });

  describe("Pending server (no DB attached yet)", () => {
    const pendingPort = 3225;
    let pendingApp: Hono;
    let pendingServer: ReturnType<typeof serve>;
    let pendingEnsRainbowServer: ENSRainbowServer;
    let pendingPublicConfig: EnsRainbow.ENSRainbowPublicConfig | null;
    let pendingDbConfig: Awaited<ReturnType<typeof buildDbConfig>> | null;

    beforeAll(async () => {
      pendingEnsRainbowServer = ENSRainbowServer.createPending();
      pendingPublicConfig = null;
      pendingDbConfig = null;
      pendingApp = createApi(
        pendingEnsRainbowServer,
        () => pendingPublicConfig,
        () => pendingDbConfig,
      );
      pendingServer = serve({
        fetch: pendingApp.fetch,
        port: pendingPort,
      });
    });

    afterAll(async () => {
      try {
        if (pendingServer) await closeHttpServer(pendingServer);
        await pendingEnsRainbowServer.close();
      } catch (error) {
        console.error("Pending server cleanup failed:", error);
      }
    });

    it("GET /health returns 200 immediately without a DB", async () => {
      const response = await fetch(`http://localhost:${pendingPort}/health`);
      expect(response.status).toBe(200);
      const data = (await response.json()) as EnsRainbow.HealthResponse;
      expect(data).toEqual({ status: "ok" } satisfies EnsRainbow.HealthResponse);
    });

    it("GET /ready returns 503 while the DB is not attached", async () => {
      const response = await fetch(`http://localhost:${pendingPort}/ready`);
      expect(response.status).toBe(503);
      const data = (await response.json()) as EnsRainbow.ServiceUnavailableError;
      expect(data.status).toBe(StatusCode.Error);
      expect(data.errorCode).toBe(ErrorCode.ServiceUnavailable);
    });

    it("GET /v1/heal/:labelhash returns 503 while the DB is not attached", async () => {
      const someLabelhash = labelhashLiteralLabel(asLiteralLabel("test"));
      const response = await fetch(`http://localhost:${pendingPort}/v1/heal/${someLabelhash}`);
      expect(response.status).toBe(503);
      const data = (await response.json()) as EnsRainbow.ServiceUnavailableError;
      expect(data.errorCode).toBe(ErrorCode.ServiceUnavailable);
    });

    it("GET /v1/labels/count and /v1/config return 503 while the DB is not attached", async () => {
      const [countRes, configRes] = await Promise.all([
        fetch(`http://localhost:${pendingPort}/v1/labels/count`),
        fetch(`http://localhost:${pendingPort}/v1/config`),
      ]);
      expect(countRes.status).toBe(503);
      expect(configRes.status).toBe(503);
    });

    it("After attachDb, /ready returns 200 and /v1/heal serves labels", async () => {
      const attachDataDir = await fs.mkdtemp(
        join(tmpdir(), "ensrainbow-test-server-pending-attach-"),
      );

      const attachDb = await ENSRainbowDB.create(attachDataDir);
      try {
        await attachDb.setPrecalculatedRainbowRecordCount(1);
        await attachDb.markIngestionFinished();
        await attachDb.setLabelSetId("pending-test");
        await attachDb.setHighestLabelSetVersion(0);
        await attachDb.addRainbowRecord("pending-label", 0);

        await pendingEnsRainbowServer.attachDb(attachDb);
        pendingDbConfig = await buildDbConfig(pendingEnsRainbowServer);
        pendingPublicConfig = buildEnsRainbowPublicConfig(pendingDbConfig);

        const readyRes = await fetch(`http://localhost:${pendingPort}/ready`);
        expect(readyRes.status).toBe(200);

        const labelhash = labelhashLiteralLabel(asLiteralLabel("pending-label"));
        const healRes = await fetch(`http://localhost:${pendingPort}/v1/heal/${labelhash}`);
        expect(healRes.status).toBe(200);
        const healData = (await healRes.json()) as EnsRainbow.HealResponse;
        expect(healData).toEqual({
          status: StatusCode.Success,
          label: "pending-label",
        } satisfies EnsRainbow.HealSuccess);

        const configRes = await fetch(`http://localhost:${pendingPort}/v1/config`);
        expect(configRes.status).toBe(200);
        const configData = (await configRes.json()) as EnsRainbow.ENSRainbowPublicConfig;
        expect(configData.serverLabelSet.labelSetId).toBe("pending-test");
        expect(configData.serverLabelSet.highestLabelSetVersion).toBe(0);

        const countRes = await fetch(`http://localhost:${pendingPort}/v1/labels/count`);
        expect(countRes.status).toBe(200);
        const countData = (await countRes.json()) as EnsRainbow.CountResponse;
        expect(countData).toEqual({
          status: StatusCode.Success,
          count: 1,
          timestamp: expect.any(String),
        } satisfies EnsRainbow.CountSuccess);
      } finally {
        await pendingEnsRainbowServer.close();
        await fs.rm(attachDataDir, { recursive: true, force: true });
      }
    });
  });

  describe("CORS headers for /v1/* routes", () => {
    it("should return CORS headers for /v1/* routes", async () => {
      const validLabel = "test-label";
      const validLabelHash = labelhashLiteralLabel(asLiteralLabel(validLabel));

      // Add test data
      await db.addRainbowRecord(validLabel, 0);

      const responses = await Promise.all([
        fetch(`http://localhost:${nonDefaultPort}/v1/heal/${validLabelHash}`, {
          method: "OPTIONS",
        }),
        fetch(`http://localhost:${nonDefaultPort}/v1/heal/0xinvalidlabelHash`, {
          method: "OPTIONS",
        }),
        fetch(`http://localhost:${nonDefaultPort}/v1/not-found`, {
          method: "OPTIONS",
        }),
        fetch(`http://localhost:${nonDefaultPort}/v1/labels/count`, {
          method: "OPTIONS",
        }),
        fetch(`http://localhost:${nonDefaultPort}/v1/config`, {
          method: "OPTIONS",
        }),
      ]);

      for (const response of responses) {
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("access-control-allow-methods")).toBe("HEAD,GET,OPTIONS");
      }
    });
  });
});
