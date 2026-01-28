import type { ReferrerLeaderboard } from "@namehash/ens-referrals/v1";

import { referrerLeaderboardCacheV1 } from "@/cache/referrer-leaderboard.cache-v1";
import { factory } from "@/lib/hono-factory";

/**
 * Type definition for the referrer leaderboard middleware context passed to downstream middleware and handlers (V1 API).
 */
export type ReferrerLeaderboardMiddlewareV1Variables = {
  /**
   * A {@link ReferrerLeaderboard} containing metrics and rankings for all referrers
   * with at least one referral within the ENS Holiday Awards period, or an {@link Error}
   * indicating failure to build the leaderboard.
   *
   * If `referrerLeaderboardV1` is an {@link Error}, no prior attempts to successfully fetch (and cache)
   * a referrer leaderboard within the lifetime of this middleware have been successful.
   *
   * If `referrerLeaderboardV1` is a {@link ReferrerLeaderboard}, a referrer leaderboard was successfully
   * fetched (and cached) at least once within the lifetime of this middleware.
   */
  referrerLeaderboardV1: ReferrerLeaderboard | Error;
};

/**
 * Middleware that provides {@link ReferrerLeaderboardMiddlewareV1Variables}
 * to downstream middleware and handlers (V1 API).
 */
export const referrerLeaderboardMiddlewareV1 = factory.createMiddleware(async (c, next) => {
  const leaderboard = await referrerLeaderboardCacheV1.read();

  c.set("referrerLeaderboardV1", leaderboard);
  await next();
});

