import { minutesToSeconds } from "date-fns";
import { describeRoute } from "hono-openapi";
import z from "zod/v4";

import {
  buildResultInternalServerError,
  buildResultOk,
  buildResultServiceUnavailable,
  type Duration,
  ResultCodes,
} from "@ensnode/ensnode-sdk";
import { makeDurationSchema } from "@ensnode/ensnode-sdk/internal";

import { params } from "@/lib/handlers/params.schema";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import {
  resultCodeToHttpStatusCode,
  resultIntoHttpResponse,
} from "@/lib/result/result-into-http-response";

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
    responses: {
      [resultCodeToHttpStatusCode(ResultCodes.Ok)]: {
        description:
          "Indexing progress is guaranteed to be within the requested distance of realtime",
      },
      [resultCodeToHttpStatusCode(ResultCodes.InternalServerError)]: {
        description: "Indexing progress cannot be determined due to an internal server error",
      },
      [resultCodeToHttpStatusCode(ResultCodes.ServiceUnavailable)]: {
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
    }),
  ),
  async (c) => {
    // context must be set by the required middleware
    if (c.var.indexingStatus === undefined) {
      return resultIntoHttpResponse(
        c,
        buildResultInternalServerError(
          `Invariant(amirealtime-api): indexingStatusMiddleware required.`,
        ),
      );
    }

    // return 503 response error with details on prerequisite being unavailable
    if (c.var.indexingStatus instanceof Error) {
      return resultIntoHttpResponse(
        c,
        // todo: differentiate between 500 vs. 503 based on error type
        buildResultServiceUnavailable(
          `Invariant(amirealtime-api): Indexing Status has to be resolved successfully before 'maxWorstCaseDistance' can be applied.`,
        ),
      );
    }

    const { maxWorstCaseDistance } = c.req.valid("query");
    const { worstCaseDistance, snapshot } = c.var.indexingStatus;
    const { slowestChainIndexingCursor } = snapshot;

    // return 503 response error with details on
    // requested `maxWorstCaseDistance` vs. actual `worstCaseDistance`
    if (worstCaseDistance > maxWorstCaseDistance) {
      // todo: differentiate between 500 vs. 503 based on error type
      return resultIntoHttpResponse(
        c,
        buildResultServiceUnavailable(
          `Indexing Status 'worstCaseDistance' must be below or equal to the requested 'maxWorstCaseDistance'; worstCaseDistance = ${worstCaseDistance}; maxWorstCaseDistance = ${maxWorstCaseDistance}`,
        ),
      );
    }

    // return 200 response OK with current details on `maxWorstCaseDistance`,
    // `slowestChainIndexingCursor`, and `worstCaseDistance`
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
