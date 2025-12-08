import { createFactory } from "hono/factory";

import type { CanAccelerateMiddlewareVariables } from "@/middleware/can-accelerate.middleware";
import type { IndexingStatusMiddlewareVariables } from "@/middleware/indexing-status.middleware";
import type { IsRealtimeMiddlewareVariables } from "@/middleware/is-realtime.middleware";
import type { ReferrerLeaderboardMiddlewareVariables } from "@/middleware/referrer-leaderboard.middleware";

export type MiddlewareVariables = IndexingStatusMiddlewareVariables &
  IsRealtimeMiddlewareVariables &
  CanAccelerateMiddlewareVariables &
  ReferrerLeaderboardMiddlewareVariables;

export const factory = createFactory<{
  Variables: Partial<MiddlewareVariables>;
}>();
