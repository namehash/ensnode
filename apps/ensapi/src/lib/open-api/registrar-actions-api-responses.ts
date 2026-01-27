import { resolver as resolveOpenApiSchema } from "hono-openapi";
import { z } from "zod/v4";

import {
  buildPageContext,
  buildResultInsufficientIndexingProgress,
  buildResultInternalServerError,
  buildResultInvalidRequest,
  buildResultOkRegistrarActions,
  buildResultServiceUnavailable,
  type InterpretedName,
  RegistrarActionTypes,
  ResultCodes,
  serializeResultOkRegistrarActions,
} from "@ensnode/ensnode-sdk";
import {
  makeResultErrorInsufficientIndexingProgressSchema,
  makeResultErrorInternalServerErrorSchema,
  makeResultErrorInvalidRequestSchema,
  makeResultErrorServiceUnavailableSchema,
  makeSerializedResultOkRegistrarActionsSchema,
} from "@ensnode/ensnode-sdk/internal";

import type { OpenApiRouteResponse } from "@/lib/open-api/responses";

export const registrarActionsApi200Response = {
  description: "Successfully retrieved registrar actions",
  content: {
    "application/json": {
      schema: resolveOpenApiSchema(makeSerializedResultOkRegistrarActionsSchema()),
      examples: {
        [`Result Code: ${ResultCodes.Ok}`]: {
          summary: "Successfully retrieved registrar actions",
          value: serializeResultOkRegistrarActions(
            buildResultOkRegistrarActions(
              {
                registrarActions: [
                  {
                    action: {
                      id: "176901653900000000000000010000000024284662000000000000016650000000000000521",
                      type: RegistrarActionTypes.Registration,
                      incrementalDuration: 31536000,
                      registrant: "0x5438f076431321224969fc258d1c99d340b8af5a",
                      registrationLifecycle: {
                        subregistry: {
                          subregistryId: {
                            chainId: 1,
                            address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
                          },
                          node: "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae",
                        },
                        node: "0x286f7fa67d93511310a9f9e21e54b780eb3cf8e4887e20d6e6d6c59e2b1a0213",
                        expiresAt: 1800552539,
                      },
                      pricing: {
                        baseCost: {
                          currency: "ETH",
                          amount: BigInt("1726125951960390"),
                        },
                        premium: {
                          currency: "ETH",
                          amount: BigInt("591384407687275916"),
                        },
                        total: {
                          currency: "ETH",
                          amount: BigInt("593110533639236306"),
                        },
                      },
                      referral: {
                        encodedReferrer:
                          "0x0000000000000000000000007e491cde0fbf08e51f54c4fb6b9e24afbd18966d",
                        decodedReferrer: "0x7e491cde0fbf08e51f54c4fb6b9e24afbd18966d",
                      },
                      block: {
                        number: 24284662,
                        timestamp: 1769016539,
                      },
                      transactionHash:
                        "0xb87a54ebb64e2ebc581127e7f71f7c56090a5c92583ce238644ce3ec23e1c13c",
                      eventIds: [
                        "176901653900000000000000010000000024284662000000000000016650000000000000521",
                        "176901653900000000000000010000000024284662000000000000016650000000000000525",
                      ],
                    },
                    name: "export.eth" as InterpretedName,
                  },
                ],
                pageContext: buildPageContext(1, 10, 0),
              },
              1700000000,
            ),
          ),
        },
      },
    },
  },
} as OpenApiRouteResponse;

export const registrarActionsApi400Response = {
  description: "Invalid request parameters",
  content: {
    "application/json": {
      schema: resolveOpenApiSchema(makeResultErrorInvalidRequestSchema()),
      examples: {
        [`Result Code: ${ResultCodes.InvalidRequest}`]: {
          summary: "Registrar Actions API invalid request",
          value: buildResultInvalidRequest(
            "parentNode param must be a hexadecimal value which starts with '0x'",
          ),
          description: "The provided `parentNode` query parameter is not a hexadecimal value.",
        },
      },
    },
  },
} as OpenApiRouteResponse;

export const registrarActionsApi500Response = {
  description: "An internal server error occurred",
  content: {
    "application/json": {
      schema: resolveOpenApiSchema(makeResultErrorInternalServerErrorSchema()),
      examples: {
        [`Result Code: ${ResultCodes.InternalServerError}`]: {
          summary: "Registrar Actions API internal server error",
          value: buildResultInternalServerError(
            "Internal server error occurred in Registrar Actions API.",
          ),
          description: "External service or dependency is unavailable.",
        },
      },
    },
  },
} as OpenApiRouteResponse;

export const registrarActionsApi503Response = {
  description: "Registrar Actions API is unavailable",
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
          summary: "Registrar Actions API is unavailable",
          value: buildResultServiceUnavailable("Registrar Actions API is currently unavailable."),
          description: "External service or dependency is unavailable.",
        },
        [`Result Code: ${ResultCodes.InsufficientIndexingProgress}`]: {
          summary: "Registrar Actions API has insufficient indexing progress",
          value: buildResultInsufficientIndexingProgress(
            "The connected ENSIndexer has insufficient omnichain indexing progress to serve this request.",
            {
              indexingStatus: "omnichain-backfill",
              slowestChainIndexingCursor: 1700000000,
              earliestChainIndexingCursor: 1690000000,
              progressSufficientFrom: {
                indexingStatus: "omnichain-following",
                chainIndexingCursor: 1705000000,
              },
            },
          ),
        },
      },
    },
  },
} as OpenApiRouteResponse;

export const openApiResponsesRegistrarActionsApi = {
  200: registrarActionsApi200Response,
  400: registrarActionsApi400Response,
  500: registrarActionsApi500Response,
  503: registrarActionsApi503Response,
} as const;
