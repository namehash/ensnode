import { serve } from "@hono/node-server";

import { createApi } from "@/lib/api";
import { ENSRainbowDB } from "@/lib/database";
import { logger } from "@/utils/logger";

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
