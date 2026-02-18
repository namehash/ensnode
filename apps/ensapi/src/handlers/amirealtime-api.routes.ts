import { createRoute } from "@hono/zod-openapi";
import { minutesToSeconds } from "date-fns";
import { z } from "zod/v4";

import type { Duration } from "@ensnode/ensnode-sdk";
import { makeDurationSchema } from "@ensnode/ensnode-sdk/internal";

import { params } from "@/lib/handlers/params.schema";

export const basePath = "/amirealtime";

// Set default `maxWorstCaseDistance` for `GET /amirealtime` endpoint to one minute.
export const AMIREALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE: Duration = minutesToSeconds(1);

export const amIRealtimeGetMeta = createRoute({
  method: "get",
  path: "/",
  tags: ["Meta"],
  summary: "Check indexing progress",
  description:
    "Checks if the indexing progress is guaranteed to be within a requested worst-case distance of realtime",
  request: {
    query: z.object({
      maxWorstCaseDistance: params.queryParam
        .optional()
        .default(AMIREALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE)
        .pipe(makeDurationSchema("maxWorstCaseDistance query param"))
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

export const routes = [amIRealtimeGetMeta];
