import { createRoute } from "@hono/zod-openapi";
import { z } from "zod/v4";

import {
  RECORDS_PER_PAGE_DEFAULT,
  RECORDS_PER_PAGE_MAX,
  RegistrarActionsOrders,
} from "@ensnode/ensnode-sdk";
import {
  makeLowercaseAddressSchema,
  makeNodeSchema,
  makePositiveIntegerSchema,
  makeUnixTimestampSchema,
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
      .describe("Page number for pagination"),

    recordsPerPage: params.queryParam
      .optional()
      .default(RECORDS_PER_PAGE_DEFAULT)
      .pipe(z.coerce.number())
      .pipe(makePositiveIntegerSchema("recordsPerPage").max(RECORDS_PER_PAGE_MAX))
      .describe("Number of records per page"),

    withReferral: params.boolstring
      .optional()
      .default(false)
      .describe("Filter to only include actions with referrals"),

    decodedReferrer: makeLowercaseAddressSchema("decodedReferrer")
      .optional()
      .describe("Filter by decoded referrer address"),

    beginTimestamp: params.queryParam
      .pipe(z.coerce.number())
      .pipe(makeUnixTimestampSchema("beginTimestamp"))
      .optional()
      .describe("Filter actions at or after this Unix timestamp"),

    endTimestamp: params.queryParam
      .pipe(z.coerce.number())
      .pipe(makeUnixTimestampSchema("endTimestamp"))
      .optional()
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
    },
    400: {
      description: "Invalid query",
    },
    500: {
      description: "Internal server error",
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
    },
    400: {
      description: "Invalid input",
    },
    500: {
      description: "Internal server error",
    },
  },
});

export const routes = [getRegistrarActionsRoute, getRegistrarActionsByParentNodeRoute];
