import type { HealthResponse } from "@ensnode/ensrainbow-sdk/types";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import type { Context as HonoContext } from "hono";
import { ENSRainbowDB } from "../lib/database";
import { ENSRainbowServer } from "../lib/server";
import { logger } from "../utils/logger";

export interface ServerCommandOptions {
  dataDir: string;
  port: number;
}

/**
 * Creates and configures the ENS Rainbow server application
 */
export async function createServer(db: ENSRainbowDB): Promise<Hono> {
  const app = new Hono();
  const rainbow = await ENSRainbowServer.init(db);

  app.get("/v1/heal/:labelhash", async (c: HonoContext) => {
    const labelhash = c.req.param("labelhash") as `0x${string}`;
    logger.debug(`Healing request for labelhash: ${labelhash}`);
    const result = await rainbow.heal(labelhash);
    logger.debug(`Heal result:`, result);
    return c.json(result, result.errorCode);
  });

  app.get("/health", (c: HonoContext) => {
    logger.debug("Health check request");
    const result: HealthResponse = { status: "ok" };
    return c.json(result);
  });

  app.get("/v1/labels/count", async (c: HonoContext) => {
    logger.debug("Label count request");
    const result = await rainbow.labelCount();
    logger.debug(`Count result:`, result);
    return c.json(result, result.errorCode);
  });

  return app;
}

export async function serverCommand(options: ServerCommandOptions): Promise<void> {
  logger.info(`ENS Rainbow server starting on port ${options.port}...`);

  const db = await ENSRainbowDB.open(options.dataDir);

  try {
    const app = await createServer(db);

    const server = serve({
      fetch: app.fetch,
      port: options.port,
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info("Shutting down server...");
      try {
        await server.close();
        await db.close();
        logger.info("Server shutdown complete");
      } catch (error) {
        logger.error("Error during shutdown:", error);
        throw error;
      }
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    await db.close();
    throw error;
  }
}
