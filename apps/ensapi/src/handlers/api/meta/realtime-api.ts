import { createApp } from "@/lib/hono-factory";
import { assertApiReadinessMiddleware } from "@/middleware/assert-api-readiness.middleware";
import { indexingStatusMiddleware } from "@/middleware/indexing-status.middleware";

import { realtimeGetMeta } from "./realtime-api.routes";

const app = createApp({ middlewares: [assertApiReadinessMiddleware, indexingStatusMiddleware] });

// allow performance monitoring clients to read HTTP Status for the provided
// `maxWorstCaseDistance` param
app.openapi(realtimeGetMeta, async (c) => {
  // return 503 response error with details on prerequisite being unavailable
  if (c.var.indexingStatus instanceof Error) {
    return c.json(
      {
        message: `Invariant(realtime-api): Indexing Status has to be resolved successfully before 'maxWorstCaseDistance' can be applied.`,
      },
      503,
    );
  }

  const { maxWorstCaseDistance } = c.req.valid("query");
  const { worstCaseDistance, snapshot } = c.var.indexingStatus;
  const { slowestChainIndexingCursor } = snapshot;

  // return 503 response error with details on
  // requested `maxWorstCaseDistance` vs. actual `worstCaseDistance`
  if (worstCaseDistance > maxWorstCaseDistance) {
    return c.json(
      {
        message: `Indexing Status 'worstCaseDistance' must be below or equal to the requested 'maxWorstCaseDistance'; worstCaseDistance = ${worstCaseDistance}; maxWorstCaseDistance = ${maxWorstCaseDistance}`,
      },
      503,
    );
  }

  // return 200 response OK with current details on `maxWorstCaseDistance`,
  // `slowestChainIndexingCursor`, and `worstCaseDistance`
  return c.json(
    {
      maxWorstCaseDistance,
      slowestChainIndexingCursor,
      worstCaseDistance,
    },
    200,
  );
});

export default app;
