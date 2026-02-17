import { promises as fs } from "node:fs";

import { serve } from "@hono/node-server";
import type { Hono } from "hono";
import { labelhash } from "viem";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { type EnsRainbow, ErrorCode, StatusCode } from "@ensnode/ensrainbow-sdk";

import { ENSRainbowDB } from "@/lib/database";

import { createServer } from "./server-command";

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

      app = await createServer(db);

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
      if (server) await server.close();
      if (db) await db.close();
      await fs.rm(TEST_DB_DIR, { recursive: true, force: true });
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  });

  describe("GET /v1/heal/:labelHash", () => {
    it("should return the label for a valid labelHash", async () => {
      const validLabel = "test-label";
      const validLabelHash = labelhash(validLabel);

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

  describe("GET /v1/labels/count", () => {
    it("should return cached count from startup (same as /v1/config)", async () => {
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

    it("should match recordsCount in /v1/config", async () => {
      const [countRes, configRes] = await Promise.all([
        fetch(`http://localhost:${nonDefaultPort}/v1/labels/count`),
        fetch(`http://localhost:${nonDefaultPort}/v1/config`),
      ]);
      const countData = (await countRes.json()) as EnsRainbow.CountSuccess;
      const configData = (await configRes.json()) as EnsRainbow.ENSRainbowPublicConfig;
      expect(countData.status).toBe(StatusCode.Success);
      expect(countData.count).toBe(configData.recordsCount);
    });
  });

  describe("GET /v1/version", () => {
    it("should return version information", async () => {
      const response = await fetch(`http://localhost:${nonDefaultPort}/v1/version`);
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.status).toEqual(StatusCode.Success);
      expect(typeof data.versionInfo.version).toBe("string");
      expect(typeof data.versionInfo.dbSchemaVersion).toBe("number");
      expect(typeof data.versionInfo.labelSet.labelSetId).toBe("string");
      expect(typeof data.versionInfo.labelSet.highestLabelSetVersion).toBe("number");
    });
  });

  describe("GET /v1/config", () => {
    it("should return cached config from startup", async () => {
      // The config is cached on startup with count = 0 (set in beforeAll)
      // Even if the database is cleared in beforeEach, the cached config is returned
      const response = await fetch(`http://localhost:${nonDefaultPort}/v1/config`);
      expect(response.status).toBe(200);
      const data = (await response.json()) as EnsRainbow.ENSRainbowPublicConfig;

      expect(typeof data.version).toBe("string");
      expect(data.version.length).toBeGreaterThan(0);
      expect(data.labelSet.labelSetId).toBe("test-label-set-id");
      expect(data.labelSet.highestLabelSetVersion).toBe(0);
      // Config is cached on startup with count = 0, so it returns the cached value
      expect(data.recordsCount).toBe(0);
    });

    it("should return cached config even if database count changes", async () => {
      // Set a different count in the database
      // However, the config is cached on startup, so it will still return the cached value
      await db.setPrecalculatedRainbowRecordCount(42);

      const response = await fetch(`http://localhost:${nonDefaultPort}/v1/config`);
      expect(response.status).toBe(200);
      const data = (await response.json()) as EnsRainbow.ENSRainbowPublicConfig;

      expect(typeof data.version).toBe("string");
      expect(data.version.length).toBeGreaterThan(0);
      expect(data.labelSet.labelSetId).toBe("test-label-set-id");
      expect(data.labelSet.highestLabelSetVersion).toBe(0);
      // Config is cached on startup with count = 0, so changing the DB doesn't affect it
      expect(data.recordsCount).toBe(0);
    });
  });

  describe("CORS headers for /v1/* routes", () => {
    it("should return CORS headers for /v1/* routes", async () => {
      const validLabel = "test-label";
      const validLabelHash = labelhash(validLabel);

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
        fetch(`http://localhost:${nonDefaultPort}/v1/version`, {
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
