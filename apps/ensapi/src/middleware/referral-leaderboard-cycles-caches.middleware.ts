import {
  initializeReferralLeaderboardCyclesCaches,
  type ReferralLeaderboardCyclesCacheMap,
} from "@/cache/referral-leaderboard-cycles.cache";
import { factory } from "@/lib/hono-factory";
import { referralProgramCycleConfigSetMiddleware } from "@/middleware/referral-program-cycle-set.middleware";

/**
 * Type definition for the referral leaderboard cycles caches middleware context passed to downstream middleware and handlers.
 */
export type ReferralLeaderboardCyclesCachesMiddlewareVariables = {
  /**
   * A map from cycle slug to its dedicated {@link SWRCache} containing {@link ReferrerLeaderboard}.
   *
   * Returns an {@link Error} if the referral program cycle config set failed to load.
   *
   * When the map is available, each cycle has its own independent cache. Therefore, each cycle's cache
   * can be asynchronously loaded / refreshed from others, and a failure to
   * load data for one cycle doesn't break data successfully loaded
   * for other cycles.
   *
   * When reading from a specific cycle's cache, it will return either:
   * - The {@link ReferrerLeaderboard} if successfully cached
   * - An {@link Error} if the cache failed to build
   *
   * Individual cycle caches maintain their own stale-while-revalidate behavior, so a previously
   * successfully fetched cycle continues serving its data even if a subsequent refresh fails.
   */
  referralLeaderboardCyclesCaches: ReferralLeaderboardCyclesCacheMap | Error;
};

/**
 * Middleware that provides {@link ReferralLeaderboardCyclesCachesMiddlewareVariables}
 * to downstream middleware and handlers.
 *
 * This middleware depends on {@link referralProgramCycleConfigSetMiddleware} to provide
 * the cycle config set. If the cycle config set failed to load, this middleware propagates the error.
 * Otherwise, it initializes caches for each cycle in the config set.
 */
export const referralLeaderboardCyclesCachesMiddleware = factory.createMiddleware(
  async (c, next) => {
    const cycleConfigSet = c.get("referralProgramCycleConfigSet");

    // Invariant: referralProgramCycleConfigSetMiddleware must be applied before this middleware
    if (cycleConfigSet === undefined) {
      throw new Error(
        "Invariant(referralLeaderboardCyclesCachesMiddleware): referralProgramCycleConfigSetMiddleware required",
      );
    }

    // If cycle config set loading failed, propagate the error
    if (cycleConfigSet instanceof Error) {
      c.set("referralLeaderboardCyclesCaches", cycleConfigSet);
      await next();
      return;
    }

    // Initialize caches for the cycle config set
    const caches = initializeReferralLeaderboardCyclesCaches(cycleConfigSet);
    c.set("referralLeaderboardCyclesCaches", caches);
    await next();
  },
);
