import di from "@/di";
import {
  healthCheckRoute,
  readinessCheckRoute,
} from "@/handlers/ensapi-probes/ensapi-probes-api.routes";
import { createApp } from "@/lib/hono-factory";
import logger from "@/lib/logger";

const app = createApp();

app.openapi(healthCheckRoute, async (c) => {
  try {
    if (!c.var.serviceStatus?.isHealthy) {
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
    if (!c.var.serviceStatus?.isReady) {
      const { ensDbConfig } = di.context;
      throw new Error(
        `ENSDb instance is not ready. This may indicate that ENSNode Schema migrations were not completed successfully or that the ENSNode Metadata record for ${ensDbConfig.ensIndexerSchemaName} ENSIndexer Schema has not been created yet.`,
      );
    }

    return c.json({ responseCode: "ok" }, 200);
  } catch (error) {
    logger.debug(error, "Readiness check failed");
    return c.json({ responseCode: "error", message: "Service Unavailable" }, 503);
  }
});

export default app;
