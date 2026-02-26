import { createRoute } from "@hono/zod-openapi";
import { z } from "zod/v4";

import { params } from "@/lib/handlers/params.schema";

export const basePath = "/api/resolve";

export const resolveRecordsRoute = createRoute({
  method: "get",
  path: "/records/{name}",
  tags: ["Resolution"],
  summary: "Resolve ENS Records",
  description: "Resolves ENS records for a given name",
  request: {
    params: z.object({
      name: params.name,
    }),
    query: z
      .object({
        ...params.selectionParams.shape,
        trace: params.trace,
        accelerate: params.accelerate,
      })
      .transform((value) => {
        const { trace, accelerate, ...selectionParams } = value;
        const selection = params.selection.parse(selectionParams);
        return { selection, trace, accelerate };
      }),
  },
  responses: {
    200: {
      description: "Successfully resolved records",
    },
  },
});

export const resolvePrimaryNameRoute = createRoute({
  method: "get",
  path: "/primary-name/{address}/{chainId}",
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
    },
  },
});

export const resolvePrimaryNamesRoute = createRoute({
  method: "get",
  path: "/primary-names/{address}",
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
    },
  },
});

export const routes = [resolveRecordsRoute, resolvePrimaryNameRoute, resolvePrimaryNamesRoute];
