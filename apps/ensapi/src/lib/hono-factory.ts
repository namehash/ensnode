import { createFactory } from "hono/factory";

import type { CanAccelerateMiddlewareVariables } from "@/middleware/can-accelerate.middleware";
import type { IndexingStatusMiddlewareVariables } from "@/middleware/indexing-status.middleware";
import type { IsRealtimeMiddlewareVariables } from "@/middleware/is-realtime.middleware";
import type { ReferrerLeaderboardCacheMiddlewareVariables } from "@/middleware/referrer-leaderboard-cache.middleware";

type MiddlewareVariables = Partial<
  IndexingStatusMiddlewareVariables &
    IsRealtimeMiddlewareVariables &
    CanAccelerateMiddlewareVariables &
    ReferrerLeaderboardCacheMiddlewareVariables
>;

export const factory = createFactory<{
  Variables: MiddlewareVariables;
}>();
