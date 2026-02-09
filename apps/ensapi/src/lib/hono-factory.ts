import { createFactory } from "hono/factory";

import type { CanAccelerateMiddlewareVariables } from "@/middleware/can-accelerate.middleware";
import type { IndexingStatusMiddlewareVariables } from "@/middleware/indexing-status.middleware";
import type { IsRealtimeMiddlewareVariables } from "@/middleware/is-realtime.middleware";
import type { ReferralLeaderboardEditionsCachesMiddlewareVariables } from "@/middleware/referral-leaderboard-editions-caches.middleware";
import type { ReferralProgramEditionConfigSetMiddlewareVariables } from "@/middleware/referral-program-edition-set.middleware";
import type { ReferrerLeaderboardMiddlewareVariables } from "@/middleware/referrer-leaderboard.middleware";

export type MiddlewareVariables = IndexingStatusMiddlewareVariables &
  IsRealtimeMiddlewareVariables &
  CanAccelerateMiddlewareVariables &
  ReferrerLeaderboardMiddlewareVariables &
  ReferralProgramEditionConfigSetMiddlewareVariables &
  ReferralLeaderboardEditionsCachesMiddlewareVariables;

export const factory = createFactory<{
  Variables: Partial<MiddlewareVariables>;
}>();
