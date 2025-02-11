import { join } from "path";
import { serve } from "@hono/node-server";
import { ClassicLevel } from "classic-level";
import type { HealthResponse } from "ensrainbow-sdk/types";
import { Hono } from "hono";
import type { Context as HonoContext } from "hono";
import { ByteArray } from "viem";
import type { ENSRainbowContext } from "./operations.js";
import { countLabels, heal } from "./operations.js";

export const app = new Hono();
export const DATA_DIR = process.env.VITEST
  ? join(process.cwd(), "test-data")
  : process.env.DATA_DIR || join(process.cwd(), "data");

console.log(`Initializing ENS Rainbow with data directory: ${DATA_DIR}`);

export let db: ClassicLevel<ByteArray, string>;

// Initialize database with error handling
try {
  db = new ClassicLevel<ByteArray, string>(DATA_DIR, {
    keyEncoding: "binary",
    valueEncoding: "utf8",
  });
} catch (error) {
  console.error("Failed to initialize database:", error);
  console.error(`Please ensure the directory ${DATA_DIR} exists and is writable`);
  process.exit(1);
}

const rainbow: ENSRainbowContext = { db };

app.get("/v1/heal/:labelhash", async (c: HonoContext) => {
  const labelhash = c.req.param("labelhash") as `0x${string}`;
  const result = await heal(rainbow, labelhash);
  return c.json(result, result.errorCode);
});

// Health check endpoint
app.get("/health", (c: HonoContext) => {
  const result: HealthResponse = { status: "ok" };
  return c.json(result);
});

// Get count of healable labels
app.get("/v1/labels/count", async (c: HonoContext) => {
  const result = await countLabels(rainbow);
  return c.json(result, result.errorCode);
});

// Only start the server if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || "3001", 10);
  console.log(`ENS Rainbow server starting on port ${port}...`);

  const server = serve({
    fetch: app.fetch,
    port: port,
  });

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down server...");
    try {
      await server.close();
      await db.close();
      console.log("Server shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
