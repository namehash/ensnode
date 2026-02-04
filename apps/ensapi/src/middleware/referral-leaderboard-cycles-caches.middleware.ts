import {
  type ReferralLeaderboardCyclesCacheMap,
  referralLeaderboardCyclesCaches,
} from "@/cache/referral-leaderboard-cycles.cache";
import { factory } from "@/lib/hono-factory";

/**
 * Type definition for the referral leaderboard cycles caches middleware context passed to downstream middleware and handlers.
 */
export type ReferralLeaderboardCyclesCachesMiddlewareVariables = {
  /**
   * A map from cycle ID to its dedicated {@link SWRCache} containing {@link ReferrerLeaderboard}.
   *
   * Each cycle has its own independent cache to preserve successful data even when other cycles fail.
   * When reading from a specific cycle's cache, it will return either:
   * - The {@link ReferrerLeaderboard} if successfully cached
   * - An {@link Error} if the cache failed to build
   *
   * Individual cycle caches maintain their own stale-while-revalidate behavior, so a previously
   * successfully fetched cycle continues serving its data even if a subsequent refresh fails.
   */
  referralLeaderboardCyclesCaches: ReferralLeaderboardCyclesCacheMap;
};

/**
 * Middleware that provides {@link ReferralLeaderboardCyclesCachesMiddlewareVariables}
 * to downstream middleware and handlers.
 */
export const referralLeaderboardCyclesCachesMiddleware = factory.createMiddleware(
  async (c, next) => {
    c.set("referralLeaderboardCyclesCaches", referralLeaderboardCyclesCaches);
    await next();
  },
);
