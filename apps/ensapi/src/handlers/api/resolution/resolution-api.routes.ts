import { createRoute, z } from "@hono/zod-openapi";

import {
  errorResponseInternalServerErrorExample,
  errorResponseInvalidAddressExample,
  errorResponseInvalidNameExample,
  makeErrorResponseSchema,
  makeResolvePrimaryNameResponseSchema,
  makeResolvePrimaryNamesResponseSchema,
  makeResolveRecordsResponseSchema,
  resolvePrimaryNameResponseExample,
  resolvePrimaryNamesResponseExample,
  resolveRecordsResponseExample,
} from "@ensnode/ensnode-sdk/internal";

import { params } from "@/lib/handlers/params.schema";

export const basePath = "/api/resolve";

export const resolveRecordsRoute = createRoute({
  method: "get",
  path: "/records/{name}",
  operationId: "resolveRecords",
  tags: ["Resolution"],
  summary: "Resolve ENS Records",
  description: "Resolves ENS records for a given name",
  request: {
    params: z.object({
      name: params.name,
    }),
    query: params.resolveRecordsQuery,
  },
  responses: {
    200: {
      description: "Successfully resolved records",
      content: {
        "application/json": {
          schema: makeResolveRecordsResponseSchema().openapi({
            example: resolveRecordsResponseExample,
          }),
        },
      },
    },
    400: {
      description: "Invalid name or query parameters",
      content: {
        "application/json": {
          schema: makeErrorResponseSchema().openapi({ example: errorResponseInvalidNameExample }),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: makeErrorResponseSchema().openapi({
            example: errorResponseInternalServerErrorExample,
          }),
        },
      },
    },
  },
});

export const resolvePrimaryNameRoute = createRoute({
  method: "get",
  path: "/primary-name/{address}/{chainId}",
  operationId: "resolvePrimaryName",
  tags: ["Resolution"],
  summary: "Resolve Primary Name",
  description: "Resolves a primary name for a given `address` and `chainId`",
  request: {
    params: z.object({
      address: params.address,
      chainId: params.defaultableChainId,
    }),
    query: z.object({
      trace: params.trace,
      accelerate: params.accelerate,
    }),
  },
  responses: {
    200: {
      description: "Successfully resolved name",
      content: {
        "application/json": {
          schema: makeResolvePrimaryNameResponseSchema().openapi({
            example: resolvePrimaryNameResponseExample,
          }),
        },
      },
    },
    400: {
      description: "Invalid address or chain ID",
      content: {
        "application/json": {
          schema: makeErrorResponseSchema().openapi({
            example: errorResponseInvalidAddressExample,
          }),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: makeErrorResponseSchema().openapi({
            example: errorResponseInternalServerErrorExample,
          }),
        },
      },
    },
  },
});

export const resolvePrimaryNamesRoute = createRoute({
  method: "get",
  path: "/primary-names/{address}",
  operationId: "resolvePrimaryNames",
  tags: ["Resolution"],
  summary: "Resolve Primary Names",
  description: "Resolves all primary names for a given address across multiple chains",
  request: {
    params: z.object({
      address: params.address,
    }),
    query: z.object({
      chainIds: params.chainIdsWithoutDefaultChainId,
      trace: params.trace,
      accelerate: params.accelerate,
    }),
  },
  responses: {
    200: {
      description: "Successfully resolved records",
      content: {
        "application/json": {
          schema: makeResolvePrimaryNamesResponseSchema().openapi({
            example: resolvePrimaryNamesResponseExample,
          }),
        },
      },
    },
    400: {
      description: "Invalid address or chain IDs",
      content: {
        "application/json": {
          schema: makeErrorResponseSchema().openapi({
            example: errorResponseInvalidAddressExample,
          }),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: makeErrorResponseSchema().openapi({
            example: errorResponseInternalServerErrorExample,
          }),
        },
      },
    },
  },
});
