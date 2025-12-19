import { minutesToSeconds } from "date-fns";
import z from "zod/v4";

import type { Duration } from "@ensnode/ensnode-sdk";
import { makeDurationSchema } from "@ensnode/ensnode-sdk/internal";

import { errorResponse } from "@/lib/handlers/error-response";
import { params } from "@/lib/handlers/params.schema";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";

const app = factory.createApp();

// Set default `maxRealtimeDistance` for `GET /amirealtime` endpoint to one minute.
export const AMIREALTIME_DEFAULT_MAX_REALTIME_DISTANCE: Duration = minutesToSeconds(1);

// allow performance monitoring clients to read HTTP Status for the provided
// `maxRealtimeDistance` param
app.get(
  "/",
  validate(
    "query",
    z.object({
      maxRealtimeDistance: params.queryParam
        .optional()
        .default(AMIREALTIME_DEFAULT_MAX_REALTIME_DISTANCE)
        .pipe(makeDurationSchema("maxRealtimeDistance query param")),
    }),
  ),
  async (c) => {
    // context must be set by the required middleware
    if (c.var.indexingStatus === undefined) {
      throw new Error(`Invariant(amirealtime): indexingStatusMiddleware required.`);
    }

    if (c.var.indexingStatus instanceof Error) {
      return errorResponse(
        c,
        `Invariant(amirealtime): Indexing Status has to be resolved successfully before 'maxRealtimeDistance' can be applied.`,
      );
    }

    const { maxRealtimeDistance } = c.req.valid("query");
    const { worstCaseDistance, snapshot } = c.var.indexingStatus;
    const { slowestChainIndexingCursor } = snapshot;

    // return 503 response error with details on
    // requested `maxRealtimeDistance` vs. actual `worstCaseDistance`
    if (worstCaseDistance > maxRealtimeDistance) {
      return errorResponse(
        c,
        `Indexing Status 'worstCaseDistance' must be below or equal to the requested 'maxRealtimeDistance'; worstCaseDistance = ${worstCaseDistance}; maxRealtimeDistance = ${maxRealtimeDistance}`,
        503,
      );
    }

    // return 200 response OK with current details on `maxRealtimeDistance`,
    // `slowestChainIndexingCursor`, and `worstCaseDistance`
    return c.json({ maxRealtimeDistance, slowestChainIndexingCursor, worstCaseDistance });
  },
);

export default app;
