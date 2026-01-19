import { minutesToSeconds } from "date-fns";
import { describeRoute } from "hono-openapi";
import z from "zod/v4";

import {
  type AmIRealtimeResult,
  buildResultInternalServerError,
  buildResultOk,
  buildResultServiceUnavailable,
  type Duration,
  ResultCodes,
} from "@ensnode/ensnode-sdk";
import { makeDurationSchema } from "@ensnode/ensnode-sdk/internal";

import { params } from "@/lib/handlers/params.schema";
import { buildRouteResponsesDescription } from "@/lib/handlers/route-responses-description";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { resultIntoHttpResponse } from "@/lib/result/result-into-http-response";

const app = factory.createApp();

// Set default `maxWorstCaseDistance` for `GET /amirealtime` endpoint to one minute.
export const AMIREALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE: Duration = minutesToSeconds(1);

// allow performance monitoring clients to read HTTP Status for the provided
// `maxWorstCaseDistance` param
app.get(
  "/",
  describeRoute({
    tags: ["Meta"],
    summary: "Check indexing progress",
    description:
      "Checks if the indexing progress is guaranteed to be within a requested worst-case distance of realtime",
    responses: buildRouteResponsesDescription<AmIRealtimeResult>({
      [ResultCodes.Ok]: {
        description:
          "Indexing progress is guaranteed to be within the requested distance of realtime",
      },
      [ResultCodes.InternalServerError]: {
        description: "Indexing progress cannot be determined due to an internal server error",
      },
      [ResultCodes.ServiceUnavailable]: {
        description:
          "Indexing progress is not guaranteed to be within the requested distance of realtime or indexing status unavailable",
      },
    }),
  }),
  validate(
    "query",
    z.object({
      maxWorstCaseDistance: params.queryParam
        .optional()
        .default(AMIREALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE)
        .pipe(makeDurationSchema("maxWorstCaseDistance query param"))
        .describe("Maximum acceptable worst-case indexing distance in seconds"),
    }),
  ),
  async (c) => {
    // Invariant: Indexing Status must be available in application context
    if (c.var.indexingStatus === undefined) {
      const result = buildResultInternalServerError(
        `Invariant(amirealtime-api): Indexing Status must be available in application context.`,
      );

      return resultIntoHttpResponse(c, result);
    }

    // Invariant: Indexing Status must be resolved successfully before 'maxWorstCaseDistance' can be applied
    if (c.var.indexingStatus instanceof Error) {
      const result = buildResultServiceUnavailable(
        `Invariant(amirealtime-api): Indexing Status must be resolved successfully before 'maxWorstCaseDistance' can be applied.`,
      );

      return resultIntoHttpResponse(c, result);
    }

    const { maxWorstCaseDistance } = c.req.valid("query");
    const { worstCaseDistance, snapshot } = c.var.indexingStatus;
    const { slowestChainIndexingCursor } = snapshot;

    // Case: worst-case distance exceeds requested maximum
    if (worstCaseDistance > maxWorstCaseDistance) {
      const result = buildResultServiceUnavailable(
        `Indexing Status 'worstCaseDistance' must be below or equal to the requested 'maxWorstCaseDistance'; worstCaseDistance = ${worstCaseDistance}; maxWorstCaseDistance = ${maxWorstCaseDistance}`,
      );

      return resultIntoHttpResponse(c, result);
    }

    // Case: worst-case distance is within requested maximum
    return resultIntoHttpResponse(
      c,
      buildResultOk({
        maxWorstCaseDistance,
        slowestChainIndexingCursor,
        worstCaseDistance,
      }),
    );
  },
);

export default app;
