import type { ServeCommandConfig } from "@/config";

import { serve } from "@hono/node-server";

import { prettyPrintJson } from "@ensnode/ensnode-sdk/internal";

import { buildEnsRainbowPublicConfig } from "@/config/public";
import { createApi } from "@/lib/api";
import { ENSRainbowDB } from "@/lib/database";
import { buildDbConfig, ENSRainbowServer } from "@/lib/server";
import { logger } from "@/utils/logger";

export type ServerCommandOptions = ServeCommandConfig;

export async function serverCommand(options: ServerCommandOptions): Promise<void> {
  // console.log is used so it can't be skipped by the logger
  console.log("ENSRainbow running with config:");
  console.log(prettyPrintJson(options));

  logger.info(`ENS Rainbow server starting on port ${options.port}...`);

  const db = await ENSRainbowDB.open(options.dataDir);

  try {
    const ensRainbowServer = await ENSRainbowServer.init(db);
    const dbConfig = await buildDbConfig(ensRainbowServer);
    const publicConfig = buildEnsRainbowPublicConfig(dbConfig);

    // console.log is used so it can't be skipped by the logger
    console.log("ENSRainbow public config:");
    console.log(prettyPrintJson(publicConfig));

    const app = createApi(ensRainbowServer, publicConfig);

    const httpServer = serve({
      fetch: app.fetch,
      port: options.port,
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info("Shutting down server...");
      try {
        await httpServer.close();
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
