import { indexingStatusCache } from "@/cache/indexing-status.cache";
import {
  initializeReferralLeaderboardEditionsCaches,
  type ReferralLeaderboardEditionsCacheMap,
} from "@/cache/referral-leaderboard-editions.cache";
import { checkAndUpgradeImmutableCaches } from "@/lib/ensanalytics/referrer-leaderboard/cache-upgrade";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import type { referralProgramEditionConfigSetMiddleware } from "@/middleware/referral-program-edition-set.middleware";

const logger = makeLogger("referral-leaderboard-editions-caches-middleware");

/**
 * Type definition for the referral leaderboard editions caches middleware context passed to downstream middleware and handlers.
 */
export type ReferralLeaderboardEditionsCachesMiddlewareVariables = {
  /**
   * A map from edition slug to its dedicated {@link SWRCache} containing {@link ReferrerLeaderboard}.
   *
   * Returns an {@link Error} if the referral program edition config set failed to load.
   *
   * When the map is available, each edition has its own independent cache. Therefore, each edition's cache
   * can be asynchronously loaded / refreshed from others, and a failure to
   * load data for one edition doesn't break data successfully loaded
   * for other editions.
   *
   * When reading from a specific edition's cache, it will return either:
   * - The {@link ReferrerLeaderboard} if successfully cached
   * - An {@link Error} if the cache failed to build
   *
   * Individual edition caches maintain their own stale-while-revalidate behavior, so a previously
   * successfully fetched edition continues serving its data even if a subsequent refresh fails.
   */
  referralLeaderboardEditionsCaches: ReferralLeaderboardEditionsCacheMap | Error;
};

/**
 * Middleware that provides {@link ReferralLeaderboardEditionsCachesMiddlewareVariables}
 * to downstream middleware and handlers.
 *
 * This middleware depends on {@link referralProgramEditionConfigSetMiddleware} to provide
 * the edition config set. If the edition config set failed to load, this middleware propagates the error.
 * Otherwise, it initializes caches for each edition in the config set.
 *
 * On each request, this middleware non-blocking checks if any caches should be upgraded to immutable
 * storage based on accurate indexing timestamps. This allows caches to dynamically transition from
 * refreshing to indefinite storage as editions close.
 */
export const referralLeaderboardEditionsCachesMiddleware = factory.createMiddleware(
  async (c, next) => {
    const editionConfigSet = c.get("referralProgramEditionConfigSet");

    // Invariant: referralProgramEditionConfigSetMiddleware must be applied before this middleware
    if (editionConfigSet === undefined) {
      throw new Error(
        "Invariant(referralLeaderboardEditionsCachesMiddleware): referralProgramEditionConfigSetMiddleware required",
      );
    }

    // If edition config set loading failed, propagate the error
    if (editionConfigSet instanceof Error) {
      c.set("referralLeaderboardEditionsCaches", editionConfigSet);
      await next();
      return;
    }

    // Initialize caches for the edition config set
    const caches = initializeReferralLeaderboardEditionsCaches(editionConfigSet);
    c.set("referralLeaderboardEditionsCaches", caches);

    // Non-blocking: Check and upgrade any caches that have become immutable
    indexingStatusCache
      .read()
      .then((indexingStatus) => {
        if (!(indexingStatus instanceof Error)) {
          return checkAndUpgradeImmutableCaches(caches, editionConfigSet, indexingStatus);
        }
      })
      .catch((error) => {
        logger.error({ error }, "Failed to check and upgrade immutable caches");
      });

    await next();
  },
);
