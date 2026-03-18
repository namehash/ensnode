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

/**
 * Produces an env type where the specified keys of MiddlewareVariables are required (non-optional).
 * All other middleware variables remain optional.
 *
 * Use this as the type parameter to `createOpenApiApp` to declare which middleware variables a sub-app
 * requires, giving compile-time guarantees in handlers instead of runtime invariant assertions.
 */
type RequireVars<TRequired extends keyof MiddlewareVariables = never> = Omit<
  Partial<MiddlewareVariables>,
  TRequired
> &
  Required<Pick<MiddlewareVariables, TRequired>>;

export const factory = createFactory<AppEnv>();

/**
 * Creates an OpenAPIHono sub-app with typed middleware variable requirements.
 *
 * Pass a union of `MiddlewareVariables` keys as the type parameter to declare which
 * middleware variables handlers in this app can access as non-optional:
 *
 * ```ts
 * // c.var.canAccelerate is `boolean`, not `boolean | undefined`
 * const app = createOpenApiApp<"canAccelerate">();
 * ```
 *
 * Without a type parameter, all variables remain optional (same as before).
 */
export function createOpenApiApp<TRequired extends keyof MiddlewareVariables = never>() {
  return new OpenAPIHono<{ Variables: RequireVars<TRequired> }>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return errorResponse(c, result.error);
      }
    },
  });
}
