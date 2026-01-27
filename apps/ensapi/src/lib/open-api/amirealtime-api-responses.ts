import { resolver as resolveOpenApiSchema } from "hono-openapi";
import { z } from "zod/v4";

import {
  buildResultInsufficientIndexingProgress,
  buildResultInternalServerError,
  buildResultInvalidRequest,
  buildResultOkAmIRealtime,
  buildResultServiceUnavailable,
  ResultCodes,
} from "@ensnode/ensnode-sdk";
import {
  makeResultErrorInsufficientIndexingProgressSchema,
  makeResultErrorInternalServerErrorSchema,
  makeResultErrorInvalidRequestSchema,
  makeResultErrorServiceUnavailableSchema,
  makeResultOkAmIRealtimeSchema,
} from "@ensnode/ensnode-sdk/internal";

import type { OpenApiRouteResponse } from "@/lib/open-api/responses";

export const amIRealtimeApi200Response = {
  description: "Indexing progress is guaranteed to be within the requested distance of realtime",
  content: {
    "application/json": {
      schema: resolveOpenApiSchema(makeResultOkAmIRealtimeSchema()),
      examples: {
        [`Result Code: ${ResultCodes.Ok}`]: {
          summary: '"Am I Realtime?" API indexing progress is within requested distance',
          value: buildResultOkAmIRealtime({
            requestedMaxWorstCaseDistance: 12,
            slowestChainIndexingCursor: 1768999701,
            worstCaseDistance: 9,
            serverNow: 1768999710,
          }),
          description:
            "The connected ENSIndexer has sufficient omnichain indexing progress to serve this request.",
        },
      },
    },
  },
} as OpenApiRouteResponse;

export const amIRealtimeApi400Response = {
  description: "Invalid request parameters",
  content: {
    "application/json": {
      schema: resolveOpenApiSchema(makeResultErrorInvalidRequestSchema()),
      examples: {
        [`Result Code: ${ResultCodes.InvalidRequest}`]: {
          summary: '"Am I Realtime?" API invalid request',
          value: buildResultInvalidRequest(
            "requestedMaxWorstCaseDistance query param must be a non-negative integer (>=0)",
          ),
          description:
            "The provided `requestedMaxWorstCaseDistance` query parameter is a negative integer.",
        },
      },
    },
  },
} as OpenApiRouteResponse;

export const amIRealtimeApi500Response = {
  description: "Indexing progress cannot be determined due to an internal server error",
  content: {
    "application/json": {
      schema: resolveOpenApiSchema(makeResultErrorInternalServerErrorSchema()),
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
} as OpenApiRouteResponse;

export const amIRealtimeApi503Response = {
  description:
    "Indexing progress is not guaranteed to be within the requested distance of realtime or indexing status unavailable",
  content: {
    "application/json": {
      schema: resolveOpenApiSchema(
        z.discriminatedUnion("resultCode", [
          makeResultErrorServiceUnavailableSchema(),
          makeResultErrorInsufficientIndexingProgressSchema(),
        ]),
      ),
      examples: {
        [`Result Code: ${ResultCodes.ServiceUnavailable}`]: {
          summary: '"Am I Realtime?" API is unavailable',
          value: buildResultServiceUnavailable('"Am I Realtime?" API is currently unavailable.'),
          description: "External service or dependency is unavailable.",
        },
        [`Result Code: ${ResultCodes.InsufficientIndexingProgress}`]: {
          summary: '"Am I Realtime?" API has insufficient indexing progress',
          value: buildResultInsufficientIndexingProgress(
            "Indexing Status 'worstCaseDistance' must be below or equal to the requested 'requestedMaxWorstCaseDistance'; worstCaseDistance = 12; requestedMaxWorstCaseDistance = 10",
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
} as OpenApiRouteResponse;

export const openApiResponsesAmIRealtimeApi = {
  200: amIRealtimeApi200Response,
  400: amIRealtimeApi400Response,
  500: amIRealtimeApi500Response,
  503: amIRealtimeApi503Response,
} as const;
