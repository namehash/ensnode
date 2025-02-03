import { serve } from "@hono/node-server";
import { labelhash } from "viem";
/// <reference types="vitest" />
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app, db } from "./index";
import { LABELHASH_COUNT_KEY } from "./utils/constants";
import { labelHashToBytes } from "./utils/label-utils";
import type { CountResponse, HealError, HealResponse, HealSuccess } from "./utils/response-types";
import { ErrorCode, StatusCode } from "./utils/response-types";

describe("ENS Rainbow API", () => {
  let server: ReturnType<typeof serve>;

  beforeAll(async () => {
    // Start the server on a different port than the main app
    server = serve({
      fetch: app.fetch,
      port: 3002,
    });
  });

  beforeEach(async () => {
    // Clear database before each test
    for await (const key of db.keys()) {
      await db.del(key);
    }
  });

  afterAll(async () => {
    // Cleanup
    await server.close();
  });

  describe("GET /v1/heal/:labelhash", () => {
    it("should return the label for a valid labelhash", async () => {
      const validLabel = "test-label";
      const validLabelhash = labelhash(validLabel);

      // Add test data
      const labelHashBytes = labelHashToBytes(validLabelhash);
      await db.put(labelHashBytes, validLabel);

      const response = await fetch(`http://localhost:3002/v1/heal/${validLabelhash}`);
      expect(response.status).toBe(200);
      const data = (await response.json()) as HealResponse;
      const expectedData: HealSuccess = {
        status: StatusCode.Success,
        label: validLabel,
      };
      expect(data).toEqual(expectedData);
    });

    it("should handle missing labelhash parameter", async () => {
      const response = await fetch("http://localhost:3002/v1/heal/");
      expect(response.status).toBe(404); // Hono returns 404 for missing parameters
      const text = await response.text();
      expect(text).toBe("404 Not Found"); // Hono's default 404 response
    });

    it("should reject invalid labelhash format", async () => {
      const response = await fetch("http://localhost:3002/v1/heal/invalid-hash");
      expect(response.status).toBe(400);
      const data = (await response.json()) as HealResponse;
      const expectedData: HealError = {
        status: StatusCode.Error,
        error: "Invalid labelhash length 12 characters (expected 66)",
        errorCode: ErrorCode.BadRequest,
      };
      expect(data).toEqual(expectedData);
    });

    it("should handle non-existent labelhash", async () => {
      const nonExistentHash = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      const response = await fetch(`http://localhost:3002/v1/heal/${nonExistentHash}`);
      expect(response.status).toBe(404);
      const data = (await response.json()) as HealResponse;
      const expectedData: HealError = {
        status: StatusCode.Error,
        error: "Label not found",
        errorCode: ErrorCode.NotFound,
      };
      expect(data).toEqual(expectedData);
    });
  });

  describe("GET /health", () => {
    it("should return ok status", async () => {
      const response = await fetch("http://localhost:3002/health");
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ status: "ok" });
    });
  });

  describe("GET /v1/labels/count", () => {
    it("should throw an error when database is empty", async () => {
      const response = await fetch("http://localhost:3002/v1/labels/count");
      expect(response.status).toBe(500);
      const data = (await response.json()) as CountResponse;
      expect(data.status).toEqual(StatusCode.Error);
      expect(data.error).toBe("Internal server error");
      expect(data.errorCode).toEqual(ErrorCode.ServerError);
    });

    it("should return correct count from LABEL_COUNT_KEY", async () => {
      // Set a specific count in the database
      await db.put(LABELHASH_COUNT_KEY, "42");

      const response = await fetch("http://localhost:3002/v1/labels/count");
      expect(response.status).toBe(200);
      const data = (await response.json()) as CountResponse;
      expect(data.status).toEqual(StatusCode.Success);
      expect(data.count).toBe(42);
      expect(typeof data.timestamp).toBe("string");
      expect(() => new Date(data.timestamp as string)).not.toThrow(); // valid timestamp
    });
  });

  describe("LevelDB operations", () => {
    it("should handle values containing null bytes", async () => {
      const labelWithNull = "test\0label";
      const labelWithNullLabelhash = labelhash(labelWithNull);
      const labelHashBytes = labelHashToBytes(labelWithNullLabelhash);

      await db.put(labelHashBytes, labelWithNull);
      const retrieved = await db.get(labelHashBytes);
      expect(retrieved).toBe(labelWithNull);
    });
  });
});
