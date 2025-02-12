import { serve } from "@hono/node-server";
import type { HealthResponse } from "ensrainbow-sdk/types";
import { Hono } from "hono";
import type { Context as HonoContext } from "hono";
import { ENSRainbowDB, exitIfIncompleteIngestion, openDatabase } from "../lib/database.js";
import { ENSRainbowServer } from "../lib/server.js";
import { LogLevel, Logger, createLogger } from "../utils/logger.js";

export interface ServerCommandOptions {
  dataDir: string;
  port: number;
  logLevel: LogLevel;
}

/**
 * Creates and configures the ENS Rainbow server application
 */
export function createServer(db: ENSRainbowDB, log: Logger, logLevel: LogLevel = "info"): Hono {
  const app = new Hono();
  const rainbow = new ENSRainbowServer(db, logLevel);

  app.get("/v1/heal/:labelhash", async (c: HonoContext) => {
    const labelhash = c.req.param("labelhash") as `0x${string}`;
    log.debug(`Healing request for labelhash: ${labelhash}`);
    const result = await rainbow.heal(labelhash);
    log.debug(`Heal result:`, result);
    return c.json(result, result.errorCode);
  });

  app.get("/health", (c: HonoContext) => {
    log.debug("Health check request");
    const result: HealthResponse = { status: "ok" };
    return c.json(result);
  });

  app.get("/v1/labels/count", async (c: HonoContext) => {
    log.debug("Label count request");
    const result = await rainbow.labelCount();
    log.debug(`Count result:`, result);
    return c.json(result, result.errorCode);
  });

  return app;
}

export async function serverCommand(options: ServerCommandOptions): Promise<void> {
  const log = createLogger(options.logLevel);
  const db = await openDatabase(options.dataDir, options.logLevel);

  // Check for incomplete ingestion
  await exitIfIncompleteIngestion(db, log);

  const app = createServer(db, log, options.logLevel);

  log.info(`ENS Rainbow server starting on port ${options.port}...`);

  const server = serve({
    fetch: app.fetch,
    port: options.port,
  });

  // Handle graceful shutdown
  const shutdown = async () => {
    log.info("Shutting down server...");
    try {
      await server.close();
      await db.close();
      log.info("Server shutdown complete");
      process.exit(0);
    } catch (error) {
      log.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
