import type { ArgsConfig } from "@/config";

import { serve } from "@hono/node-server";

import { prettyPrintJson } from "@ensnode/ensnode-sdk/internal";

import { createApi } from "@/lib/api";
import { ENSRainbowDB } from "@/lib/database";
import { logger } from "@/utils/logger";

export type ServerCommandOptions = ArgsConfig;

/**
 * Creates and configures the ENS Rainbow server application.
 */
export async function createServer(db: ENSRainbowDB, argsConfig: ServerCommandOptions) {
  return createApi(db, argsConfig);
}

export async function serverCommand(options: ServerCommandOptions): Promise<void> {
  console.log("ENSRainbow running with config:");
  console.log(prettyPrintJson(options));

  logger.info(`ENS Rainbow server starting on port ${options.port}...`);

  const db = await ENSRainbowDB.open(options.dataDir);

  try {
    // Check if the database is empty (no precalculated count)
    // This prevents starting a server that can't serve any data
    try {
      await db.getPrecalculatedRainbowRecordCount();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("No precalculated count found")) {
        logger.error("Cannot start server: database is empty or uninitialized.");
        logger.error("The database must contain ingested data before the server can start.");
        logger.error("Please run the ingestion command first to populate the database.");
        throw new Error("Database is empty or uninitialized. Cannot start server.");
      }
      logger.error(error, "Cannot start server: failed to read precalculated record count.");
      throw error;
    }

    const app = await createServer(db, options);

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
        logger.error(error, "Error during shutdown:");
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
