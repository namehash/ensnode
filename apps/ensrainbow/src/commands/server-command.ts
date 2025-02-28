/// <reference types="bun-types" />
import { ENSRainbowDB } from "../lib/database";
import { createApi } from "../lib/routes";
import { logger } from "../utils/logger";
import type { Server } from "bun";

export interface ServerCommandOptions {
  dataDir: string;
  port: number;
}

/**
 * Creates and configures the ENS Rainbow server application
 */
export async function createServer(db: ENSRainbowDB) {
  return createApi(db);
}

export async function serverCommand(options: ServerCommandOptions): Promise<void> {
  logger.info(`ENS Rainbow server starting on port ${options.port}...`);

  const db = await ENSRainbowDB.open(options.dataDir);

  let server: Server | undefined;
  try {
    const app = await createServer(db);

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info("Shutting down server...");
      try {
        if (server) {
          server.stop();
        }
        await db.close();
        logger.info("Server shutdown complete");
      } catch (error) {
        logger.error("Error during shutdown:", error);
        throw error;
      }
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    // Start the server using Bun
    server = Bun.serve({
      port: options.port,
      fetch: app.fetch,
    });

  } catch (error) {
    await db.close();
    throw error;
  }
}
