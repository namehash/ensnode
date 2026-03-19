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
 */
type RequireVars<TRequired extends keyof MiddlewareVariables = never> = Omit<
  Partial<MiddlewareVariables>,
  TRequired
> &
  Required<Pick<MiddlewareVariables, TRequired>>;

export const factory = createFactory<AppEnv>();

/**
 * Creates an OpenAPIHono sub-app that declares which middleware variables its handlers require.
 *
 * Pass the required variable names as arguments. This gives two guarantees:
 *
 * 1. **Compile-time**: `c.var.<name>` is typed as non-optional inside handlers.
 * 2. **Runtime**: each handler asserts the variables are present before executing,
 *    producing a clear invariant error if the required middleware was never applied.
 *
 * ```ts
 * // c.var.canAccelerate is `boolean`, never `boolean | undefined`
 * // every handler throws if canAccelerate was not set by middleware
 * const app = createApp("canAccelerate");
 * ```
 *
 * Without arguments, all variables remain optional (same as a plain OpenAPIHono app).
 */
export function createApp<const TRequired extends keyof MiddlewareVariables = never>(
  ...requiredVars: TRequired[]
) {
  const app = new OpenAPIHono<{ Variables: RequireVars<TRequired> }>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return errorResponse(c, result.error);
      }
    },
  });

  if (requiredVars.length > 0) {
    // Bind openapi as any to avoid fighting overload resolution when wrapping.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _openapi = app.openapi.bind(app) as (...args: any[]) => any;

    // Override app.openapi to inject a runtime invariant check at the top of every handler body.
    // Running the check inside the handler (rather than as a middleware) ensures it fires after
    // all middleware — both global (index.ts) and sub-app level — have had a chance to set vars.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (app as any).openapi = (route: any, handler: any, hook?: any) =>
      _openapi(route, async (c: any) => {
        for (const dep of requiredVars) {
          if (c.var[dep] === undefined) {
            throw new Error(
              `Invariant: handler requires "${dep}" but no middleware provided it in c.var`,
            );
          }
        }
        return handler(c);
      }, hook);
  }

  return app;
}
