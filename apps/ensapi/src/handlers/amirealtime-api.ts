import { minutesToSeconds } from "date-fns";
import { describeRoute } from "hono-openapi";
import z from "zod/v4";

import type { Duration } from "@ensnode/ensnode-sdk";
import { makeDurationSchema } from "@ensnode/ensnode-sdk/internal";

import { errorResponse } from "@/lib/handlers/error-response";
import { params } from "@/lib/handlers/params.schema";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";

const app = factory.createApp();

// Set default `maxWorstCaseDistance` for `GET /amirealtime` endpoint to one minute.
export const AMIREALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE: Duration =
  minutesToSeconds(1);

// allow performance monitoring clients to read HTTP Status for the provided
// `maxWorstCaseDistance` param
app.get(
  "/",
  describeRoute({
    tags: ["Meta"],
    summary: "Check indexing progress",
    description:
      "Checks if the indexing progress is guaranteed to be within a requested worst-case distance of realtime",
    responses: {
      200: {
        description:
          "Indexing progress is guaranteed to be within the requested distance of realtime",
      },
      503: {
        description:
          "Indexing progress is not guaranteed to be within the requested distance of realtime or indexing status unavailable",
      },
    },
  }),
  validate(
    "query",
    z.object({
      maxWorstCaseDistance: params.queryParam
        .optional()
        .default(AMIREALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE)
        .pipe(makeDurationSchema("maxWorstCaseDistance query param"))
        .describe("Maximum acceptable worst-case indexing distance in seconds"),
    })
  ),
  async (c) => {
    // context must be set by the required middleware
    if (c.var.indexingStatus === undefined) {
      throw new Error(
        `Invariant(amirealtime-api): indexingStatusMiddleware required.`
      );
    }

    // return 503 response error with details on prerequisite being unavailable
    if (c.var.indexingStatus instanceof Error) {
      return errorResponse(
        c,
        `Invariant(amirealtime-api): Indexing Status has to be resolved successfully before 'maxWorstCaseDistance' can be applied.`,
        503
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
        503
      );
    }

    // return 200 response OK with current details on `maxWorstCaseDistance`,
    // `slowestChainIndexingCursor`, and `worstCaseDistance`
    return c.json({
      maxWorstCaseDistance,
      slowestChainIndexingCursor,
      worstCaseDistance,
    });
  }
);

export default app;
