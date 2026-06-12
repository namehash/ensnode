import type { Duration } from "enssdk";

import {
  hasOmnigraphApiConfigSupport,
  hasOmnigraphApiIndexingStatusSupport,
} from "@ensnode/ensnode-sdk";

import di from "@/di";
import { errorResponse } from "@/lib/handlers/error-response";
import { createApp } from "@/lib/hono-factory";
import { canAccelerateMiddleware } from "@/middleware/can-accelerate.middleware";
import { indexingStatusMiddleware } from "@/middleware/indexing-status.middleware";
import { makeIsRealtimeMiddleware } from "@/middleware/is-realtime.middleware";

/**
 * The maximum distance (in seconds) from the current time to the latest indexed block
 * for a chain to be considered "realtime" and thus eligible for protocol acceleration.
 */
const MAX_REALTIME_DISTANCE_TO_ACCELERATE: Duration = 600; // 10 minutes

const app = createApp({
  middlewares: [
    indexingStatusMiddleware,
    makeIsRealtimeMiddleware("omnigraph-api", MAX_REALTIME_DISTANCE_TO_ACCELERATE),
    canAccelerateMiddleware,
  ],
});

app.use(async (c, next) => {
  const configPrerequisite = hasOmnigraphApiConfigSupport(di.context.stackInfo.ensIndexer);
  // 503 if Omnigraph API is not available due to config prerequisites not met
  if (!configPrerequisite.supported) {
    return errorResponse(c, `Service Unavailable: ${configPrerequisite.reason}`, 503);
  }

  // 503 if indexing status snapshot is not available yet
  if (c.var.indexingStatus instanceof Error) {
    return errorResponse(
      c,
      "Service Unavailable: Indexing Status Snapshot is not available yet",
      503,
    );
  }

  // 503 if omnigraph API not available due to indexing status prerequisites not met
  const indexingStatusPrerequisite = hasOmnigraphApiIndexingStatusSupport(
    c.var.indexingStatus.snapshot.omnichainSnapshot.omnichainStatus,
  );

  if (!indexingStatusPrerequisite.supported) {
    return errorResponse(c, `Service Unavailable: ${indexingStatusPrerequisite.reason}`, 503);
  }

  await next();
});

app.use(async (c) => {
  // defer the loading of the GraphQL Server until runtime, which allows these modules to require
  // the Namechain datasource
  // TODO(ensv2): this can be removed if/when all ENSNamespaces define the Namechain Datasource
  const { yoga } = await import("@/omnigraph-api/yoga");
  return yoga.fetch(c.req.raw, c.var);
});

export default app;
