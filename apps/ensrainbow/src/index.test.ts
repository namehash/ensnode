import { serve } from "@hono/node-server";
/// <reference types="vitest" />
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app, db } from "./index";

describe("ENSRainbow API", () => {
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
      const validLabelhash = "0x7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d7d";
      const validLabel = "test-label";

      // Add test data
      const hashBytes = Buffer.from(validLabelhash.replace(/^0x/, ""), "hex");
      await db.put(hashBytes, validLabel);

      const response = await fetch(`http://localhost:3002/v1/heal/${validLabelhash}`);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe(validLabel);
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
      const data = await response.json();
      expect(data).toEqual({
        error: "Invalid labelhash - must be a 32 byte hex string",
      });
    });

    it("should handle non-existent labelhash", async () => {
      const nonExistentHash = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      const response = await fetch(`http://localhost:3002/v1/heal/${nonExistentHash}`);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Not found" });
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
      const data = (await response.json()) as {
        count: number;
        timestamp: string;
      };
      expect(data.count).toBe(0);
    });

    it("should return correct count of entries", async () => {
      // Add some test data
      const testData = [
        {
          hash: "0x1111111111111111111111111111111111111111111111111111111111111111",
          label: "test1",
        },
        {
          hash: "0x2222222222222222222222222222222222222222222222222222222222222222",
          label: "test2",
        },
        {
          hash: "0x3333333333333333333333333333333333333333333333333333333333333333",
          label: "test3",
        },
      ];

      for (const entry of testData) {
        const hashBytes = Buffer.from(entry.hash.replace(/^0x/, ""), "hex");
        await db.put(hashBytes, entry.label);
      }

      const response = await fetch("http://localhost:3002/v1/labels/count");
      expect(response.status).toBe(200);
      const data = (await response.json()) as {
        count: number;
        timestamp: string;
      };
      expect(data.count).toBe(3);
    });
  });
});
