import { join } from "path";
import { serve } from "@hono/node-server";
import { ClassicLevel } from "classic-level";
import { Hono } from "hono";
import type { Context } from "hono";
import { isHex, size, hexToBytes } from 'viem'

export const app = new Hono();
export const DATA_DIR = process.env.VITEST
  ? join(process.cwd(), "test-data")
  : process.env.DATA_DIR || join(process.cwd(), "data");

console.log(`Initializing ENS Rainbow with data directory: ${DATA_DIR}`);

export let db: ClassicLevel<Buffer, string>;

// Initialize database with error handling
try {
  db = new ClassicLevel<Buffer, string>(DATA_DIR, {
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
  const prefixedLabelHash = (labelhash.startsWith('0x') ? labelhash : `0x${labelhash}`) as `0x${string}`;

  let labelHashBytes: Uint8Array;
  try {
    labelHashBytes = hexToBytes(prefixedLabelHash);
    if (labelHashBytes.length !== 32) {
      return c.json({ error: "Invalid labelhash - must be a 32 byte hex string" }, 400);
    }
  } catch (error) {
    return c.json({ error: "Invalid labelhash - must be a valid hex string" }, 400);
  }

  try {
    const label = await db.get(Buffer.from(labelHashBytes));
    console.info(`Successfully healed labelhash ${labelhash} to label "${label}"`);
    return c.text(label);
  } catch (error) {
    if ((error as any).code === "LEVEL_NOT_FOUND") {
      console.info(`Unhealable labelhash request: ${labelhash}`);
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
    // LevelDB doesn't maintain a running count of entries, so we need to
    // iterate through all keys to get an accurate count. This operation
    // becomes more expensive as the database grows.
    let count = 0;
    for await (const _ of db.keys()) {
      count++;
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
