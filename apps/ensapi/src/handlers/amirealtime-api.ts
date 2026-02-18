import { errorResponse } from "@/lib/handlers/error-response";
import { createApp } from "@/lib/hono-factory";

import { getAmIRealtimeRoute } from "./amirealtime-api.routes";

const app = createApp();

// allow performance monitoring clients to read HTTP Status for the provided
// `maxWorstCaseDistance` param
app.openapi(getAmIRealtimeRoute, async (c) => {
  // context must be set by the required middleware
  if (c.var.indexingStatus === undefined) {
    throw new Error(`Invariant(amirealtime-api): indexingStatusMiddleware required.`);
  }

  // return 503 response error with details on prerequisite being unavailable
  if (c.var.indexingStatus instanceof Error) {
    return errorResponse(
      c,
      `Invariant(amirealtime-api): Indexing Status has to be resolved successfully before 'maxWorstCaseDistance' can be applied.`,
      503,
    );
  }

  const { maxWorstCaseDistance } = c.req.valid("query");
  const { worstCaseDistance, snapshot } = c.var.indexingStatus;
  const { slowestChainIndexingCursor } = snapshot;

  // return 503 response error with details on
  // requested `maxWorstCaseDistance` vs. actual `worstCaseDistance`
  if (worstCaseDistance > maxWorstCaseDistance) {
    return errorResponse(
      c,
      `Indexing Status 'worstCaseDistance' must be below or equal to the requested 'maxWorstCaseDistance'; worstCaseDistance = ${worstCaseDistance}; maxWorstCaseDistance = ${maxWorstCaseDistance}`,
      503,
    );
  }

  // return 200 response OK with current details on `maxWorstCaseDistance`,
  // `slowestChainIndexingCursor`, and `worstCaseDistance`
  return c.json({
    maxWorstCaseDistance,
    slowestChainIndexingCursor,
    worstCaseDistance,
  });
});

export default app;
