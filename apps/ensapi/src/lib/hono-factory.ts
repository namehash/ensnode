import { OpenAPIHono } from "@hono/zod-openapi";
import { createFactory } from "hono/factory";

import { errorResponse } from "@/lib/handlers/error-response";
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

type AppEnv = { Variables: Partial<MiddlewareVariables> };

// factory is kept for createMiddleware usage in middleware files
export const factory = createFactory<AppEnv>();

export function createApp() {
  return new OpenAPIHono<AppEnv>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return errorResponse(c, result.error);
      }
    },
  });
}
