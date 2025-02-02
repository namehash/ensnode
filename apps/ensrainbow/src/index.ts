import { join } from "path";
import { serve } from "@hono/node-server";
import { ClassicLevel } from "classic-level";
import { Hono } from "hono";
import type { Context } from "hono";
import { ByteArray } from 'viem'
import { labelHashToBytes } from "./utils/label-utils";

export const app = new Hono();
export const DATA_DIR = process.env.VITEST
  ? join(process.cwd(), "test-data")
  : process.env.DATA_DIR || join(process.cwd(), "data");

console.log(`Initializing ENS Rainbow with data directory: ${DATA_DIR}`);

export let db: ClassicLevel<ByteArray, string>;

// Initialize database with error handling
try {
  db = new ClassicLevel<ByteArray, string>(DATA_DIR, {
    valueEncoding: "utf8",
    keyEncoding: "binary",
  });
} catch (error) {
  console.error("Failed to initialize database:", error);
  console.error(`Please ensure the directory ${DATA_DIR} exists and is writable`);
  process.exit(1);
}


app.get("/v1/heal/:labelhash", async (c: Context) => {
  const labelhash = c.req.param("labelhash");
  


  let labelHashBytes: ByteArray;
  try {
    labelHashBytes = labelHashToBytes(labelhash as `0x${string}`);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: "Invalid labelhash - must be a valid hex string" }, 400);
  }

  try {
    const label = await db.get(labelHashBytes);
    console.info(`Successfully healed labelhash ${labelhash} to label "${label}"`);
    return c.text(label);
  } catch (error) {
    if ((error as any).code === "LEVEL_NOT_FOUND") {
      if (process.env.NODE_ENV === 'development') {
        console.info(`Unhealable labelhash request: ${labelhash}`);
      }
      return c.json({ error: "Not found" }, 404);
    }
    console.error("Error healing label:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Health check endpoint
app.get("/health", (c: Context) => c.json({ status: "ok" }));

// Get count of healable labels
app.get("/v1/labels/count", async (c: Context) => {
  try {
    let count = 0;
    try {
      const countStr = await db.get(LABELHASH_COUNT_KEY);
      count = parseInt(countStr, 10);
    } catch (error) {
      if ((error as any).code !== "LEVEL_NOT_FOUND") {
        throw error;
      }
    }

    return c.json({
      count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error counting labels:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
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
