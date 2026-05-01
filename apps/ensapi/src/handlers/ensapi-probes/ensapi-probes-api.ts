import {
  healthCheckRoute,
  readinessCheckRoute,
} from "@/handlers/ensapi-probes/ensapi-probes-api.routes";
import { ensDbClient } from "@/lib/ensdb/singleton";
import { createApp } from "@/lib/hono-factory";
import logger from "@/lib/logger";

const app = createApp();

app.openapi(healthCheckRoute, async (c) => {
  try {
    const isEnsDbHealthy = await ensDbClient.isHealthy();

    if (!isEnsDbHealthy) {
      throw new Error(`ENSDb instance is unhealthy`);
    }

    return c.json({ responseCode: "ok" }, 200);
  } catch (error) {
    logger.debug(error, "Health check failed");
    return c.json({ responseCode: "error", message: "Service Unavailable" }, 503);
  }
});

app.openapi(readinessCheckRoute, async (c) => {
  try {
    const isEnsDbReady = await ensDbClient.isReady();

    if (!isEnsDbReady) {
      throw new Error(
        `ENSDb instance is not ready. This may indicate that ENSNode Schema migrations were not completed successfully or that the ENSNode Metadata record for ${ensDbClient.ensIndexerSchemaName} ENSIndexer Schema has not been created yet.`,
      );
    }

    return c.json({ responseCode: "ok" }, 200);
  } catch (error) {
    logger.debug(error, "Readiness check failed");
    return c.json({ responseCode: "error", message: "Service Unavailable" }, 503);
  }
});

export default app;
