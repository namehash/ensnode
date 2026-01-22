import { minutesToSeconds } from "date-fns";
import { describeRoute, resolver as responseSchemaResolver } from "hono-openapi";
import z from "zod/v4";

import {
  buildAmIRealtimeResultOk,
  buildResultInsufficientIndexingProgress,
  buildResultInternalServerError,
  buildResultInvalidRequest,
  buildResultServiceUnavailable,
  type Duration,
  getSufficientIndexingProgressChainCursor,
  getTimestampForLowestOmnichainStartBlock,
  OmnichainIndexingStatusIds,
  ResultCodes,
} from "@ensnode/ensnode-sdk";
import {
  makeAmIRealtimeResultOkSchema,
  makeDurationSchema,
  makeResultErrorInsufficientIndexingProgressSchema,
  makeResultErrorInternalServerErrorSchema,
  makeResultErrorInvalidRequestSchema,
  makeResultErrorServiceUnavailableSchema,
} from "@ensnode/ensnode-sdk/internal";

import { params } from "@/lib/handlers/params.schema";
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
    responses: {
      200: {
        description:
          "Indexing progress is guaranteed to be within the requested distance of realtime",
        content: {
          "application/json": {
            schema: responseSchemaResolver(makeAmIRealtimeResultOkSchema()),
            examples: {
              [`Result Code: ${ResultCodes.Ok}`]: {
                summary: '"Am I Realtime?" API indexing progress is within requested distance',
                value: buildAmIRealtimeResultOk({
                  maxWorstCaseDistance: 12,
                  slowestChainIndexingCursor: 1768999701,
                  worstCaseDistance: 9,
                }),
                description:
                  "The connected ENSIndexer has sufficient omnichain indexing progress to serve this request.",
              },
            },
          },
        },
      },
      400: {
        description: "Invalid request parameters",
        content: {
          "application/json": {
            schema: responseSchemaResolver(makeResultErrorInvalidRequestSchema()),
            examples: {
              [`Result Code: ${ResultCodes.InvalidRequest}`]: {
                summary: '"Am I Realtime?" API invalid request',
                value: buildResultInvalidRequest(
                  "maxWorstCaseDistance query param must be a non-negative integer (>=0)",
                ),
                description:
                  "The provided `maxWorstCaseDistance` query parameter is a negative integer.",
              },
            },
          },
        },
      },
      500: {
        description: "Indexing progress cannot be determined due to an internal server error",
        content: {
          "application/json": {
            schema: responseSchemaResolver(makeResultErrorInternalServerErrorSchema()),
            examples: {
              [`Result Code: ${ResultCodes.InternalServerError}`]: {
                summary: '"Am I Realtime?" API internal server error',
                value: buildResultInternalServerError(
                  '"Am I Realtime?" API is currently experiencing an internal server error.',
                ),
                description: "External service or dependency is unavailable.",
              },
            },
          },
        },
      },
      503: {
        description:
          "Indexing progress is not guaranteed to be within the requested distance of realtime or indexing status unavailable",
        content: {
          "application/json": {
            schema: responseSchemaResolver(
              z.discriminatedUnion("resultCode", [
                makeResultErrorServiceUnavailableSchema(),
                makeResultErrorInsufficientIndexingProgressSchema(),
              ]),
            ),
            examples: {
              [`Result Code: ${ResultCodes.ServiceUnavailable}`]: {
                summary: '"Am I Realtime?" API is unavailable',
                value: buildResultServiceUnavailable(
                  '"Am I Realtime?" API is currently unavailable.',
                ),
                description: "External service or dependency is unavailable.",
              },
              [`Result Code: ${ResultCodes.InsufficientIndexingProgress}`]: {
                summary: '"Am I Realtime?" API has insufficient indexing progress',
                value: buildResultInsufficientIndexingProgress(
                  "Indexing Status 'worstCaseDistance' must be below or equal to the requested 'maxWorstCaseDistance'; worstCaseDistance = 12; maxWorstCaseDistance = 10",
                  {
                    indexingStatus: "omnichain-following",
                    slowestChainIndexingCursor: 1768998722,
                    earliestChainIndexingCursor: 1489165544,
                    progressSufficientFrom: {
                      indexingStatus: "omnichain-following",
                      chainIndexingCursor: 1768998731,
                    },
                  },
                ),
              },
            },
          },
        },
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
    if (c.var.indexingStatus === undefined) {
      const result = buildResultInternalServerError(
        `Invariant(amirealtime-api): Indexing Status must be available in application context.`,
      );

      return resultIntoHttpResponse(c, result);
    }

    if (c.var.indexingStatus instanceof Error) {
      const result = buildResultServiceUnavailable(
        `Invariant(amirealtime-api): Indexing Status must be resolved successfully before 'maxWorstCaseDistance' can be applied.`,
      );

      return resultIntoHttpResponse(c, result);
    }

    const { maxWorstCaseDistance } = c.req.valid("query");
    const { worstCaseDistance, snapshot } = c.var.indexingStatus;
    const { slowestChainIndexingCursor, omnichainSnapshot } = snapshot;
    const chains = Array.from(omnichainSnapshot.chains.values());

    // Case: worst-case distance exceeds requested maximum
    if (worstCaseDistance > maxWorstCaseDistance) {
      const earliestChainIndexingCursor = getTimestampForLowestOmnichainStartBlock(chains);
      const progressSufficientFromChainIndexingCursor = getSufficientIndexingProgressChainCursor(
        slowestChainIndexingCursor,
        worstCaseDistance,
        maxWorstCaseDistance,
      );

      const result = buildResultInsufficientIndexingProgress(
        `Indexing Status 'worstCaseDistance' must be below or equal to the requested 'maxWorstCaseDistance'; worstCaseDistance = ${worstCaseDistance}; maxWorstCaseDistance = ${maxWorstCaseDistance}`,
        {
          indexingStatus: omnichainSnapshot.omnichainStatus,
          slowestChainIndexingCursor,
          earliestChainIndexingCursor,
          progressSufficientFrom: {
            indexingStatus: OmnichainIndexingStatusIds.Following,
            chainIndexingCursor: progressSufficientFromChainIndexingCursor,
          },
        },
      );

      return resultIntoHttpResponse(c, result);
    }

    // Case: worst-case distance is within requested maximum

    const result = buildAmIRealtimeResultOk({
      maxWorstCaseDistance,
      slowestChainIndexingCursor,
      worstCaseDistance,
    });

    return resultIntoHttpResponse(c, result);
  },
);

export default app;
