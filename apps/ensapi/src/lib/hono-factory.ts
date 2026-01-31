import { createFactory } from "hono/factory";

import type { CanAccelerateMiddlewareVariables } from "@/middleware/can-accelerate.middleware";
import type { IndexingStatusMiddlewareVariables } from "@/middleware/indexing-status.middleware";
import type { IsRealtimeMiddlewareVariables } from "@/middleware/is-realtime.middleware";
import type { ReferrerLeaderboardMiddlewareVariables } from "@/middleware/referrer-leaderboard.middleware";
import type { ReferrerLeaderboardMiddlewareV1Variables } from "@/middleware/referrer-leaderboard.middleware-v1";

export type MiddlewareVariables = IndexingStatusMiddlewareVariables &
  IsRealtimeMiddlewareVariables &
  CanAccelerateMiddlewareVariables &
  ReferrerLeaderboardMiddlewareVariables &
  ReferrerLeaderboardMiddlewareV1Variables;

export const factory = createFactory<{
  Variables: Partial<MiddlewareVariables>;
}>();
