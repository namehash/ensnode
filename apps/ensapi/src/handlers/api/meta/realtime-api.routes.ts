import { createRoute, z } from "@hono/zod-openapi";
import { minutesToSeconds } from "date-fns";
import type { Duration } from "enssdk";

import { makeDurationSchema } from "@ensnode/ensnode-sdk/internal";

import { params } from "@/lib/handlers/params.schema";

export const basePath = "/api/realtime";

// Set default `maxWorstCaseDistance` for `GET /api/realtime` endpoint to one minute.
export const REALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE: Duration = minutesToSeconds(1);

const makeRealtimeResponseSchemaOk = () =>
  z.object({
    maxWorstCaseDistance: z
      .number()
      .describe("The requested maximum acceptable worst-case indexing distance in seconds."),
    slowestChainIndexingCursor: z
      .number()
      .describe("The timestamp of the slowest chain's latest indexed block."),
    worstCaseDistance: z
      .number()
      .describe(
        "The actual worst-case distance in seconds between 'now' and the slowest chain's indexing cursor. " +
          "This allows your client to programmatically determine whether the ENSNode instance is sufficiently synchronized for your use case.",
      ),
  });

export const realtimeGetMeta = createRoute({
  method: "get",
  path: "/",
  operationId: "getRealtime",
  tags: ["Meta"],
  summary: "Check realtime indexing status",
  description:
    "A simplified monitoring API for checking whether an ENSNode instance has indexed sufficient blocks to be within an acceptable distance from the current 'tip' of all indexed chains. " +
    "Instead of manually inspecting the `worstCaseDistance` field from the Indexing Status API, you can use this endpoint to request a specific maximum acceptable distance and receive an immediate HTTP status code indicating whether the instance is sufficiently synchronized.\n\n" +
    "The `maxWorstCaseDistance` parameter accepts a duration value in seconds, representing the max worst case distance from the current 'tip' of all indexed chains. " +
    "Note that this is a worst-case distance check. This operation uses the latest cached indexing status snapshot to determine worst-case distance. " +
    "The true indexing status is generally ahead of the worst-case distance.",
  request: {
    query: z.object({
      maxWorstCaseDistance: params.queryParam
        .optional()
        .default(REALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE)
        .pipe(
          z.coerce
            .number({
              error: "maxWorstCaseDistance query param must be a number",
            })
            .pipe(makeDurationSchema("maxWorstCaseDistance query param")),
        )
        .openapi({ type: "integer", minimum: 0 })
        .describe(
          "Maximum acceptable worst-case indexing distance in seconds. Defaults to one minute.",
        ),
    }),
  },
  responses: {
    200: {
      description:
        "The latest indexed block of each chain is guaranteed within the requested distance from realtime.",
      content: {
        "application/json": {
          schema: makeRealtimeResponseSchemaOk(),
        },
      },
    },
    503: {
      description:
        "The latest indexed block of each chain is NOT guaranteed within the requested distance from realtime, or the indexing status is unavailable.",
    },
  },
});
