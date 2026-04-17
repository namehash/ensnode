import { OpenAPIHono } from "@hono/zod-openapi";
import type { MiddlewareHandler } from "hono";
import { createFactory } from "hono/factory";

import { errorResponse } from "@/lib/handlers/error-response";
import type { CanAccelerateMiddlewareVariables } from "@/middleware/can-accelerate.middleware";
import type { IndexingStatusMiddlewareVariables } from "@/middleware/indexing-status.middleware";
import type { IsRealtimeMiddlewareVariables } from "@/middleware/is-realtime.middleware";
import type { ReferralLeaderboardEditionsCachesMiddlewareVariables } from "@/middleware/referral-leaderboard-editions-caches.middleware";
import type { ReferralProgramEditionConfigSetMiddlewareVariables } from "@/middleware/referral-program-edition-set.middleware";
import type { StackInfoMiddlewareVariables } from "@/middleware/stack-info.middleware";

export type MiddlewareVariables = IndexingStatusMiddlewareVariables &
  IsRealtimeMiddlewareVariables &
  CanAccelerateMiddlewareVariables &
  ReferralProgramEditionConfigSetMiddlewareVariables &
  ReferralLeaderboardEditionsCachesMiddlewareVariables &
  StackInfoMiddlewareVariables;

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

/** A middleware that declares the context variable keys it produces via `__produces`. */
export type ProducingMiddleware<K extends keyof MiddlewareVariables = keyof MiddlewareVariables> =
  MiddlewareHandler<AppEnv> & { readonly __produces: readonly K[] };

type ExtractProduced<T> = T extends ProducingMiddleware<infer K> ? K : never;

/**
 * Tags a middleware with the context variable keys it produces.
 * Pass the result to `createApp` to get compile-time + runtime guarantees on `c.var`.
 *
 * ```ts
 * export const indexingStatusMiddleware = producing(
 *   ["indexingStatus"],
 *   factory.createMiddleware(async (c, next) => { ... })
 * );
 * ```
 */
export function producing<const K extends keyof MiddlewareVariables>(
  keys: readonly K[],
  middleware: MiddlewareHandler<AppEnv>,
): ProducingMiddleware<K> {
  return Object.assign(middleware, { __produces: keys });
}

/**
 * Creates an OpenAPIHono sub-app that declares which middleware variables its handlers require.
 *
 * Pass middlewares in execution order. Producing middlewares (created with `producing()`) give
 * two additional guarantees beyond plain `app.use()`:
 *
 * 1. **Compile-time**: `c.var.<name>` is typed as non-optional inside handlers.
 * 2. **Runtime**: each handler asserts the variables are present before executing,
 *    producing a clear invariant error if the required middleware was never applied.
 *
 * Plain middlewares (without `__produces`) are applied in order but don't affect typing.
 *
 * ```ts
 * const app = createApp({
 *   middlewares: [
 *     indexingStatusMiddleware,   // producing — c.var.indexingStatus becomes non-optional
 *     nameTokensApiMiddleware,    // plain gate — applied but doesn't affect types
 *   ],
 * });
 * ```
 *
 * Without arguments, all variables remain optional (same as a plain OpenAPIHono app).
 */
export function createApp<
  const TMiddlewares extends readonly (ProducingMiddleware<any> | MiddlewareHandler<AppEnv>)[] = [],
>({ middlewares }: { middlewares?: TMiddlewares } = {}) {
  type TRequired = ExtractProduced<TMiddlewares[number]>;
  const mws: readonly (ProducingMiddleware<any> | MiddlewareHandler<AppEnv>)[] = middlewares ?? [];
  const requiredVars = mws
    .filter((m): m is ProducingMiddleware<any> => "__produces" in m)
    .flatMap((m) => [...m.__produces]) as TRequired[];

  const app = new OpenAPIHono<{ Variables: RequireVars<TRequired> }>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return errorResponse(c, result.error);
      }
    },
  });

  // Apply the middlewares in order so callers don't need separate app.use() calls.
  for (const middleware of mws) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use(middleware as any);
  }

  if (requiredVars.length > 0) {
    // Bind openapi as any to avoid fighting overload resolution when wrapping.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _openapi = app.openapi.bind(app) as (...args: any[]) => any;

    // Override app.openapi to inject a runtime invariant check at the top of every handler body.
    // Running the check inside the handler (rather than as a middleware) ensures it fires after
    // all middleware have had a chance to set vars.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (app as any).openapi = (route: any, handler: any, hook?: any) =>
      _openapi(
        route,
        async (c: any) => {
          for (const dep of requiredVars) {
            if (c.var[dep] === undefined) {
              throw new Error(
                `Invariant: handler requires "${dep}" but no middleware provided it in c.var.
                Probably middleware didn't produce it.`,
              );
            }
          }
          return handler(c);
        },
        hook,
      );
  }

  return app;
}
