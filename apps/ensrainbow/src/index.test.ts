import { serve } from "@hono/node-server";
/// <reference types="vitest" />
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { labelhash } from "viem";
import { labelHashToBytes } from "./utils/label-utils";
import { app, db } from "./index";
import type { ErrorResponse, SuccessResponse } from "./utils/response-types";

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
      const data = await response.json() as SuccessResponse;
      expect(data).toEqual({
        status: 'success',
        label: validLabel
      });
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
      const data = await response.json() as ErrorResponse;
      expect(data).toEqual({
        status: 'error',
        error: "Labelhash must be 0x-prefixed"
      });
    });

    it("should handle non-existent labelhash", async () => {
      const nonExistentHash = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      const response = await fetch(`http://localhost:3002/v1/heal/${nonExistentHash}`);
      expect(response.status).toBe(404);
      const data = await response.json() as ErrorResponse;
      expect(data).toEqual({
        status: 'error',
        error: "Label not found"
      });
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

  describe("GET /v1/count", () => {
    it("should return 0 when database is empty", async () => {
      const response = await fetch("http://localhost:3002/v1/labels/count");
      expect(response.status).toBe(200);
      const data = (await response.json()) as { count: number; timestamp: string };
      expect(data.count).toBe(0);
    });

    it("should return correct count of entries", async () => {
      // Add some test data
      const testData = ["test1", "test2", "test3"].map(label => ({
        hash: labelhash(label),
        label: label
      }));

      for (const entry of testData) {
        const labelHashBytes = labelHashToBytes(entry.hash);
        await db.put(labelHashBytes, entry.label);
      }

      const response = await fetch("http://localhost:3002/v1/labels/count");
      expect(response.status).toBe(200);
      const data = (await response.json()) as { count: number; timestamp: string };
      expect(data.count).toBe(3);
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
