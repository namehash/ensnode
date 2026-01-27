import { minutesToSeconds } from "date-fns";
import { describeRoute } from "hono-openapi";
import z from "zod/v4";

import {
  buildResultInsufficientIndexingProgress,
  buildResultOkAmIRealtime,
  type Duration,
  getTimestampForLowestOmnichainStartBlock,
  OmnichainIndexingStatusIds,
  ResultCodes,
} from "@ensnode/ensnode-sdk";
import { makeDurationSchema } from "@ensnode/ensnode-sdk/internal";

import { getIndexingStatusForSupportedApiHandler } from "@/lib/handlers/api-support";
import { params } from "@/lib/handlers/params.schema";
import { validate } from "@/lib/handlers/validate";
import { factory } from "@/lib/hono-factory";
import { openApiResponsesAmIRealtimeApi } from "@/lib/open-api/amirealtime-api-responses";
import { resultIntoHttpResponse } from "@/lib/result/result-into-http-response";

const app = factory.createApp();

// Set default `requestedMaxWorstCaseDistance` for `GET /amirealtime` endpoint to one minute.
export const AMIREALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE: Duration = minutesToSeconds(1);

// allow performance monitoring clients to read HTTP Status for the provided
// `requestedMaxWorstCaseDistance` param
app.get(
  "/",
  describeRoute({
    tags: ["Meta"],
    summary: "Check indexing progress",
    description:
      "Checks if the indexing progress is guaranteed to be within a requested worst-case distance of realtime",
    responses: openApiResponsesAmIRealtimeApi,
  }),
  validate(
    "query",
    z.object({
      requestedMaxWorstCaseDistance: params.queryParam
        .optional()
        .default(AMIREALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE)
        .pipe(makeDurationSchema("requestedMaxWorstCaseDistance query param"))
        .describe("Maximum acceptable worst-case indexing distance in seconds"),
    }),
  ),
  async (c) => {
    const indexingStatusResult = getIndexingStatusForSupportedApiHandler(c.var.indexingStatus);

    // Return any error result from indexing status check
    if (indexingStatusResult.resultCode !== ResultCodes.Ok) {
      return resultIntoHttpResponse(c, indexingStatusResult);
    }

    const { requestedMaxWorstCaseDistance } = c.req.valid("query");
    const { indexingStatus } = indexingStatusResult.data;
    const { worstCaseDistance, snapshot, projectedAt } = indexingStatus;
    const { slowestChainIndexingCursor, omnichainSnapshot } = snapshot;
    const chains = Array.from(omnichainSnapshot.chains.values());

    // Case: worst-case distance exceeds requested maximum
    if (worstCaseDistance > requestedMaxWorstCaseDistance) {
      const earliestChainIndexingCursor = getTimestampForLowestOmnichainStartBlock(chains);
      // Progress is considered sufficient from the point where
      // the worst-case distance would be within the requested maximum
      const progressSufficientFromChainIndexingCursor =
        slowestChainIndexingCursor + worstCaseDistance - requestedMaxWorstCaseDistance;

      const result = buildResultInsufficientIndexingProgress(
        `Indexing Status 'worstCaseDistance' must be below or equal to the requested 'requestedMaxWorstCaseDistance'; worstCaseDistance = ${worstCaseDistance}; requestedMaxWorstCaseDistance = ${requestedMaxWorstCaseDistance}`,
        {
          currentIndexingStatus: omnichainSnapshot.omnichainStatus,
          currentIndexingCursor: slowestChainIndexingCursor,
          startIndexingCursor: earliestChainIndexingCursor,
          targetIndexingStatus: OmnichainIndexingStatusIds.Following,
          targetIndexingCursor: progressSufficientFromChainIndexingCursor,
        },
      );

      return resultIntoHttpResponse(c, result);
    }

    // Case: worst-case distance is within requested maximum
    const result = buildResultOkAmIRealtime({
      requestedMaxWorstCaseDistance,
      slowestChainIndexingCursor,
      worstCaseDistance,
      serverNow: projectedAt,
    });

    return resultIntoHttpResponse(c, result);
  },
);

export default app;
