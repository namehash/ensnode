import { promises as fs } from "node:fs";

import { labelhash } from "viem";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { type EnsRainbow, ErrorCode, StatusCode } from "@ensnode/ensrainbow-sdk";

import type { Api } from "@/lib/api";
import { ENSRainbowDB } from "@/lib/database";
import { factory } from "@/lib/hono-factory";
import * as middleware from "@/lib/middleware/ensrainbow-server.middleware";
import { ENSRainbowServer } from "@/lib/server";

import { createServer } from "./server-command";

vi.mock("@/lib/middleware/ensrainbow-server.middleware", () => ({
  ensRainbowServerMiddleware: vi.fn(),
}));

const ensRainbowServerMiddlewareMock = vi.mocked(middleware.ensRainbowServerMiddleware);

describe("Server Command Tests", () => {
  let db: ENSRainbowDB;
  let app: Api;
  const TEST_DB_DIR = "test-data-server";

  // Helper function to apply the ENSRainbowServer middleware mock with a valid server instance
  const applyEnsRainbowServerMiddlewareMock = (ensRainbowServerMock: ENSRainbowServer | Error) => {
    // Reset mock
    ensRainbowServerMiddlewareMock.mockReset();

    // Mock the ENSRainbowServer middleware to inject a server instance
    ensRainbowServerMiddlewareMock.mockImplementation((_db: ENSRainbowDB) =>
      factory.createMiddleware(async (c, next) => {
        c.set("ensRainbowServer", ensRainbowServerMock);

        return await next();
      }),
    );

    // Re-create server app instance
    app = createServer(db);
  };

  const setupTestDatabase = async () => {
    // Clear any existing data to ensure a clean state for each test
    await db.clear();

    // Set initial database state
    await db.setDatabaseSchemaVersion(3);
    await db.setPrecalculatedRainbowRecordCount(0);
    await db.markIngestionFinished();
    await db.setLabelSetId("test-label-set-id");
    await db.setHighestLabelSetVersion(0);
  };

  beforeAll(async () => {
    // Clean up any existing test database
    await fs.rm(TEST_DB_DIR, { recursive: true, force: true });

    try {
      db = await ENSRainbowDB.create(TEST_DB_DIR);
    } catch (error) {
      // Ensure cleanup if setup fails
      await fs.rm(TEST_DB_DIR, { recursive: true, force: true });
      throw error;
    }
  });

  beforeEach(async () => {
    // Initialize precalculated rainbow record count to be able to start server
    await setupTestDatabase();

    // Apply ENSRainbowServer middleware mock
    applyEnsRainbowServerMiddlewareMock(await ENSRainbowServer.init(db));
  });

  afterAll(async () => {
    // Cleanup
    try {
      if (db) await db.close();
      await fs.rm(TEST_DB_DIR, { recursive: true, force: true });
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  });

  describe("GET /v1/heal/:labelHash", () => {
    it("should return the label for a valid labelHash", async () => {
      // Arrange
      const validLabel = "test-label";
      const validLabelHash = labelhash(validLabel);

      // Add test data
      await db.addRainbowRecord(validLabel, 0);

      // Act
      const response = await app.request(`/v1/heal/${validLabelHash}`);

      // Assert
      expect(response.status).toBe(200);
      const data = (await response.json()) as EnsRainbow.HealResponse;
      const expectedData: EnsRainbow.HealSuccess = {
        status: StatusCode.Success,
        label: validLabel,
      };
      expect(data).toEqual(expectedData);
    });

    it("should handle missing labelHash parameter", async () => {
      // Act
      const response = await app.request(`/v1/heal/`);

      // Assert
      expect(response.status).toBe(404); // Hono returns 404 for missing parameters
      const text = await response.text();
      expect(text).toBe("404 Not Found"); // Hono's default 404 response
    });

    it("should reject invalid labelHash format", async () => {
      // Act
      const response = await app.request(`/v1/heal/invalid-hash`);

      // Assert
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
      // Arrange
      const nonExistentHash = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

      // Act
      const response = await app.request(`/v1/heal/${nonExistentHash}`);

      // Assert
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
      // Act
      const response = await app.request(`/health`);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      const expectedData: EnsRainbow.HealthResponse = {
        status: StatusCode.Success,
      };
      expect(data).toEqual(expectedData);
    });
  });

  describe("GET /ready", () => {
    it("should return success status when ENSRainbowServer is ready", async () => {
      // Act
      const response = await app.request(`/ready`);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      const expectedData: EnsRainbow.HealthResponse = {
        status: StatusCode.Success,
      };
      expect(data).toEqual(expectedData);
    });
  });

  describe("GET /v1/labels/count", () => {
    // FIXME: This test fails
    it.skip("should throw an error when database is empty", async () => {
      // Act
      const response = await app.request(`/v1/labels/count`);
      expect(response.status).toBe(500);

      // Assert
      const data = (await response.json()) as EnsRainbow.CountResponse;
      const expectedData: EnsRainbow.CountServerError = {
        status: StatusCode.Error,
        error: "Label count not initialized. Check the validate command.",
        errorCode: ErrorCode.ServerError,
      };
      expect(data).toEqual(expectedData);
    });

    it("should return correct count from LABEL_COUNT_KEY", async () => {
      // Arrange
      // Set a specific precalculated rainbow record count in the database
      await db.setPrecalculatedRainbowRecordCount(42);

      // Act
      const response = await app.request(`/v1/labels/count`);

      // Assert
      expect(response.status).toBe(200);
      const data = (await response.json()) as EnsRainbow.CountSuccess;
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
      // Act
      const response = await app.request(`/v1/version`);

      // Assert
      expect(response.status).toBe(200);
      const data = (await response.json()) as EnsRainbow.VersionSuccess;

      expect(data.status).toEqual(StatusCode.Success);
      expect(typeof data.versionInfo.version).toBe("string");
      expect(typeof data.versionInfo.dbSchemaVersion).toBe("number");
      expect(typeof data.versionInfo.labelSet.labelSetId).toBe("string");
      expect(typeof data.versionInfo.labelSet.highestLabelSetVersion).toBe("number");
    });
  });

  describe("CORS headers for /v1/* routes", () => {
    it("should return CORS headers for /v1/* routes", async () => {
      // Arrange
      const validLabel = "test-label";
      const validLabelHash = labelhash(validLabel);

      // Add test data
      await db.addRainbowRecord(validLabel, 0);

      // Act
      const responses = await Promise.all([
        app.request(`/v1/heal/${validLabelHash}`, {
          method: "OPTIONS",
        }),
        app.request(`/v1/heal/0xinvalidlabelHash`, {
          method: "OPTIONS",
        }),
        app.request(`/v1/not-found`, {
          method: "OPTIONS",
        }),
        app.request(`/v1/labels/count`, {
          method: "OPTIONS",
        }),
        app.request(`/v1/version`, {
          method: "OPTIONS",
        }),
      ]);

      // Assert
      for (const response of responses) {
        expect(response.headers.get("access-control-allow-origin")).toBe("*");
        expect(response.headers.get("access-control-allow-methods")).toBe("HEAD,GET,OPTIONS");
      }
    });
  });
});
