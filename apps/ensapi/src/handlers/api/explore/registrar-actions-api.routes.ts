import { createRoute, z } from "@hono/zod-openapi";

import {
  RECORDS_PER_PAGE_DEFAULT,
  RECORDS_PER_PAGE_MAX,
  RegistrarActionsOrders,
} from "@ensnode/ensnode-sdk";
import {
  errorResponseBadRequestExample,
  makeErrorResponseSchema,
  makeNodeSchema,
  makeNormalizedAddressSchema,
  makePositiveIntegerSchema,
  makeRegistrarActionsResponseErrorSchema,
  makeSerializedRegistrarActionsResponseOkSchema,
  makeUnixTimestampSchema,
  registrarActionsResponseOkExample,
} from "@ensnode/ensnode-sdk/internal";

import { params } from "@/lib/handlers/params.schema";

export const basePath = "/api/registrar-actions";

// Shared query schema for registrar actions
export const registrarActionsQuerySchema = z
  .object({
    orderBy: z
      .enum(RegistrarActionsOrders)
      .default(RegistrarActionsOrders.LatestRegistrarActions)
      .describe("Order of results"),

    page: params.queryParam
      .optional()
      .default(1)
      .pipe(z.coerce.number())
      .pipe(makePositiveIntegerSchema("page"))
      .openapi({ type: "integer", minimum: 1, default: 1 })
      .describe("Page number for pagination"),

    recordsPerPage: params.queryParam
      .optional()
      .default(RECORDS_PER_PAGE_DEFAULT)
      .pipe(z.coerce.number())
      .pipe(makePositiveIntegerSchema("recordsPerPage").max(RECORDS_PER_PAGE_MAX))
      .openapi({
        type: "integer",
        minimum: 1,
        maximum: RECORDS_PER_PAGE_MAX,
        default: RECORDS_PER_PAGE_DEFAULT,
      })
      .describe("Number of records per page"),

    withReferral: params.boolstring
      .optional()
      .default(false)
      .describe("Filter to only include actions with referrals")
      .openapi({ default: false }),

    decodedReferrer: makeNormalizedAddressSchema("decodedReferrer")
      .optional()
      .describe("Filter by decoded referrer address"),

    beginTimestamp: params.queryParam
      .pipe(z.coerce.number())
      .pipe(makeUnixTimestampSchema("beginTimestamp"))
      .optional()
      .openapi({ type: "integer" })
      .describe("Filter actions at or after this Unix timestamp"),

    endTimestamp: params.queryParam
      .pipe(z.coerce.number())
      .pipe(makeUnixTimestampSchema("endTimestamp"))
      .optional()
      .openapi({ type: "integer" })
      .describe("Filter actions at or before this Unix timestamp"),
  })
  .refine(
    (data) => {
      // If both timestamps are provided, endTimestamp must be >= beginTimestamp
      if (data.beginTimestamp !== undefined && data.endTimestamp !== undefined) {
        return data.endTimestamp >= data.beginTimestamp;
      }
      return true;
    },
    {
      message: "endTimestamp must be greater than or equal to beginTimestamp",
      path: ["endTimestamp"],
    },
  );

export type RegistrarActionsQuery = z.output<typeof registrarActionsQuerySchema>;

export const getRegistrarActionsRoute = createRoute({
  method: "get",
  path: "/",
  operationId: "getRegistrarActions",
  tags: ["Explore"],
  summary: "Get Registrar Actions",
  description: "Returns all registrar actions with optional filtering and pagination",
  request: {
    query: registrarActionsQuerySchema,
  },
  responses: {
    200: {
      description: "Successfully retrieved registrar actions",
      content: {
        "application/json": {
          schema: makeSerializedRegistrarActionsResponseOkSchema().openapi({
            example: registrarActionsResponseOkExample,
          }),
        },
      },
    },
    400: {
      description: "Invalid query",
      content: {
        "application/json": {
          schema: makeErrorResponseSchema().openapi({ example: errorResponseBadRequestExample }),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: makeRegistrarActionsResponseErrorSchema("Registrar Actions Error Response"),
        },
      },
    },
  },
});

export const getRegistrarActionsByParentNodeRoute = createRoute({
  method: "get",
  path: "/{parentNode}",
  operationId: "getRegistrarActionsByParentNode",
  tags: ["Explore"],
  summary: "Get Registrar Actions by Parent Node",
  description:
    "Returns registrar actions filtered by parent node hash with optional additional filtering and pagination",
  request: {
    params: z.object({
      parentNode: makeNodeSchema("parentNode param").describe(
        "Parent node to filter registrar actions",
      ),
    }),
    query: registrarActionsQuerySchema,
  },
  responses: {
    200: {
      description: "Successfully retrieved registrar actions",
      content: {
        "application/json": {
          schema: makeSerializedRegistrarActionsResponseOkSchema(
            "Registrar Actions By ParentNode Response",
          ).openapi({
            example: registrarActionsResponseOkExample,
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
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: makeRegistrarActionsResponseErrorSchema(
            "Registrar Actions By ParentNode Error Response",
          ),
        },
      },
    },
  },
});
