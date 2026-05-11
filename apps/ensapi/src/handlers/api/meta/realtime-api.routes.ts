import { createRoute, z } from "@hono/zod-openapi";
import { minutesToSeconds } from "date-fns";
import type { Duration } from "enssdk";

import { makeDurationSchema } from "@ensnode/ensnode-sdk/internal";

import { params } from "@/lib/handlers/params.schema";

export const basePath = "/api/realtime";

// Set default `maxWorstCaseDistance` for `GET /api/realtime` endpoint to one minute.
export const REALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE: Duration = minutesToSeconds(1);

export const realtimeGetMeta = createRoute({
  method: "get",
  path: "/",
  operationId: "getRealtime",
  tags: ["Meta"],
  summary: "Check realtime indexing status",
  description:
    "Checks if the indexing status is guaranteed to be within a requested worst-case distance of realtime. Note that this is a worst-case distance check. This operation uses the latest cached indexing status snapshot to determine worst-case distance. The true indexing status is generally ahead of the worst-case distance",
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
        .describe("Maximum acceptable worst-case indexing distance in seconds"),
    }),
  },
  responses: {
    200: {
      description:
        "Indexing progress is guaranteed to be within the requested distance of realtime",
    },
    503: {
      description:
        "Indexing progress is not guaranteed to be within the requested distance of realtime or indexing status unavailable",
    },
  },
});
