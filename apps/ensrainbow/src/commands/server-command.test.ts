import { promises as fs } from "fs";
import { type EnsRainbow, ErrorCode, StatusCode } from "@ensnode/ensrainbow-sdk";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { labelhash } from "viem";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
    it("should throw an error when database is empty", async () => {
      const response = await fetch(`http://localhost:${nonDefaultPort}/v1/labels/count`);
      expect(response.status).toBe(500);
      const data = (await response.json()) as EnsRainbow.CountResponse;
      const expectedData: EnsRainbow.CountServerError = {
        status: StatusCode.Error,
        error: "Label count not initialized. Check the validate command.",
        errorCode: ErrorCode.ServerError,
      };
      expect(data).toEqual(expectedData);
    });

    it("should return correct count from LABEL_COUNT_KEY", async () => {
      // Set a specific precalculated rainbow record count in the database
      await db.setPrecalculatedRainbowRecordCount(42);

      const response = await fetch(`http://localhost:${nonDefaultPort}/v1/labels/count`);
      expect(response.status).toBe(200);
      const data = (await response.json()) as EnsRainbow.CountResponse;
      const expectedData: EnsRainbow.CountSuccess = {
        status: StatusCode.Success,
        count: 42,
        timestamp: expect.any(String),
      };
      expect(data).toEqual(expectedData);
      expect(() => new Date(data.timestamp as string)).not.toThrow(); // valid timestamp
    });
  });

  describe("GET /v1/version", () => {
    it("should return version information", async () => {
      const response = await fetch(`http://localhost:${nonDefaultPort}/v1/version`);
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.status).toEqual(StatusCode.Success);
      expect(typeof data.versionInfo.version).toBe("string");
      expect(typeof data.versionInfo.schemaVersion).toBe("number");
      expect(typeof data.versionInfo.labelSetId).toBe("string");
      expect(typeof data.versionInfo.highestLabelSetVersion).toBe("number");
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
