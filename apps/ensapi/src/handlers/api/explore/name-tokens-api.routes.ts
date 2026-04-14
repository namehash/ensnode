import { createRoute, z } from "@hono/zod-openapi";

import {
  errorResponseBadRequestExample,
  errorResponseInternalServerErrorExample,
  makeErrorResponseSchema,
  makeNameTokensResponseErrorNameTokensNotIndexedSchema,
  makeNameTokensResponseErrorSchema,
  makeNameTokensResponseSchema,
  makeNodeSchema,
  nameTokensNotIndexedExample,
  nameTokensResponseOkExample,
  nameTokensServiceUnavailableExample,
} from "@ensnode/ensnode-sdk/internal";

import { params } from "@/lib/handlers/params.schema";

export const basePath = "/api/name-tokens";

/**
 * Request Query Schema
 *
 * Name Tokens API can be requested by either `name` or `domainId`, and
 * can never be requested by both, or neither.
 */
export const nameTokensQuerySchema = z
  .object({
    domainId: makeNodeSchema("request.domainId").optional().describe("Domain node hash identifier"),
    name: params.name.optional().describe("ENS name to look up tokens for"),
  })
  .refine((data) => (data.domainId !== undefined) !== (data.name !== undefined), {
    message: "Exactly one of 'domainId' or 'name' must be provided",
  });

export type NameTokensQuery = z.output<typeof nameTokensQuerySchema>;

export const getNameTokensRoute = createRoute({
  method: "get",
  path: "/",
  operationId: "getNameTokens",
  tags: ["Explore"],
  summary: "Get Name Tokens",
  description: "Returns name tokens for the requested identifier (domainId or name)",
  request: {
    query: nameTokensQuerySchema,
  },
  responses: {
    200: {
      description: "Name tokens known",
      content: {
        "application/json": {
          schema: makeNameTokensResponseSchema("Name Tokens Response", true).openapi({
            example: nameTokensResponseOkExample,
          }),
        },
      },
    },
    400: {
      description: "Invalid input",
      content: {
        "application/json": {
          schema: makeErrorResponseSchema().openapi({ example: errorResponseBadRequestExample }),
        },
      },
    },
    404: {
      description: "Name tokens not indexed",
      content: {
        "application/json": {
          schema: makeNameTokensResponseErrorNameTokensNotIndexedSchema().openapi({
            example: nameTokensNotIndexedExample,
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
    503: {
      description:
        "Service unavailable - Name Tokens API prerequisites not met (indexing status not ready or required plugins not activated)",
      content: {
        "application/json": {
          schema: makeNameTokensResponseErrorSchema().openapi({
            example: nameTokensServiceUnavailableExample,
          }),
        },
      },
    },
  },
});
