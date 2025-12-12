import type { ReferrerLeaderboard } from "@namehash/ens-referrals";

import { referrerLeaderboardCache } from "@/cache/referrer-leaderboard.cache";
import { factory } from "@/lib/hono-factory";

/**
 * Type definition for the referrer leaderboard middleware context passed to downstream middleware and handlers.
 */
export type ReferrerLeaderboardMiddlewareVariables = {
  /**
   * A {@link ReferrerLeaderboard} containing metrics and rankings for all referrers
   * with at least one referral within the ENS Holiday Awards period, or an {@link Error}
   * indicating failure to build the leaderboard.
   *
   * If `referrerLeaderboard` is an {@link Error}, no prior attempts to successfully fetch (and cache)
   * a referrer leaderboard within the lifetime of this middleware have been successful.
   *
   * If `referrerLeaderboard` is a {@link ReferrerLeaderboard}, a referrer leaderboard was successfully
   * fetched (and cached) at least once within the lifetime of this middleware.
   */
  referrerLeaderboard: ReferrerLeaderboard | Error;
};

/**
 * Middleware that provides {@link ReferrerLeaderboardMiddlewareVariables}
 * to downstream middleware and handlers.
 */
export const referrerLeaderboardMiddleware = factory.createMiddleware(async (c, next) => {
  const leaderboard = await referrerLeaderboardCache.read();

  if (leaderboard === null) {
    c.set(
      "referrerLeaderboard",
      new Error(
        "Unable to generate a new referrer leaderboard. No referrer leaderboards have been successfully fetched and stored into cache since service startup. This may indicate the referrer leaderboard service is unreachable or in an error state.",
      ),
    );
  } else {
    c.set("referrerLeaderboard", leaderboard.value);
  }

  await next();
});
