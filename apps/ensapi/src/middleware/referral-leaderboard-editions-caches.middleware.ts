import type {
  ReferralProgramEditionConfig,
  ReferralProgramEditionConfigSet,
  ReferrerLeaderboard,
} from "@namehash/ens-referrals/v1";
import { minutesToSeconds } from "date-fns";

import { getLatestIndexedBlockRef, SWRCache } from "@ensnode/ensnode-sdk";

import { indexingStatusCache } from "@/cache/indexing-status.cache";
import {
  createEditionLeaderboardBuilder,
  initializeReferralLeaderboardEditionsCaches,
  type ReferralLeaderboardEditionsCacheMap,
} from "@/cache/referral-leaderboard-editions.cache";
import { assumeReferralProgramEditionImmutablyClosed } from "@/lib/ensanalytics/referrer-leaderboard/closeout";
import { factory } from "@/lib/hono-factory";
import { makeLogger } from "@/lib/logger";
import type { referralProgramEditionConfigSetMiddleware } from "@/middleware/referral-program-edition-set.middleware";

const logger = makeLogger("referral-leaderboard-editions-caches-middleware");

/**
 * Tracks in-progress cache upgrades to prevent concurrent upgrades of the same edition.
 * Maps edition slug to the upgrade promise.
 */
const inProgressUpgrades = new Map<string, Promise<void>>();

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
 * Upgrades a single edition's cache from regular SWR to immutable storage.
 *
 * This function:
 * 1. Creates a new cache with infinite TTL and proactive initialization
 * 2. Waits for the new cache to successfully load data
 * 3. Verifies the loaded data is immutably closed (fresh enough)
 * 4. Only then destroys the old cache and swaps in the new one
 *
 * If initialization fails or data is not fresh enough, keeps the old cache
 * and the upgrade will be retried on a future request.
 *
 * @param editionSlug - The edition slug being upgraded
 * @param oldCache - The existing cache to be replaced
 * @param editionConfig - The edition configuration
 * @param caches - The map of all edition caches (for swapping)
 */
async function upgradeEditionCache(
  editionSlug: string,
  oldCache: SWRCache<ReferrerLeaderboard>,
  editionConfig: ReferralProgramEditionConfig,
  caches: ReferralLeaderboardEditionsCacheMap,
): Promise<void> {
  logger.info({ editionSlug }, "Starting cache upgrade to immutable storage");

  // Create new cache with proactive initialization (starts loading immediately)
  const newCache = new SWRCache<ReferrerLeaderboard>({
    fn: createEditionLeaderboardBuilder(editionConfig),
    ttl: Number.POSITIVE_INFINITY,
    proactiveRevalidationInterval: undefined,
    errorTtl: minutesToSeconds(1),
    proactivelyInitialize: true,
  });

  // Wait for the new cache to successfully initialize
  const result = await newCache.read();

  if (result instanceof Error) {
    logger.warn(
      { editionSlug, error: result },
      "Failed to initialize new cache, keeping old cache",
    );
    newCache.destroy();
    return;
  }

  // Verify the data is fresh enough (immutably closed based on its own accurateAsOf)
  const isImmutable = assumeReferralProgramEditionImmutablyClosed(
    result.rules,
    result.accurateAsOf,
  );

  if (!isImmutable) {
    logger.warn(
      { editionSlug, accurateAsOf: result.accurateAsOf },
      "New cache data is not fresh enough to be considered immutably closed, keeping old cache",
    );
    newCache.destroy();
    return;
  }

  // Success! Swap the caches
  logger.info({ editionSlug }, "New cache successfully initialized and verified, swapping caches");

  oldCache.destroy();
  caches.set(editionSlug, newCache);

  logger.info({ editionSlug }, "Cache upgrade to immutable storage complete");
}

/**
 * Checks all caches and upgrades any that have become immutable to store them indefinitely.
 *
 * This function is called non-blocking on each request to opportunistically upgrade caches
 * when editions close. Each edition's upgrade runs independently in the background, ensuring:
 * - No data loss: old cache continues serving while new cache initializes
 * - Graceful failure: if new cache fails to initialize, old cache remains
 * - No race conditions: atomic check-and-set prevents concurrent upgrades of same edition
 * - Parallel upgrades: multiple editions can upgrade simultaneously
 *
 * Once a cache is upgraded to immutable storage (infinite TTL, no proactive revalidation),
 * the quick check ensures minimal overhead on all future requests.
 *
 * @param caches - The map of edition caches to check and potentially upgrade
 * @param editionConfigSet - The edition config set containing rules for each edition
 */
async function checkAndUpgradeImmutableCaches(
  caches: ReferralLeaderboardEditionsCacheMap,
  editionConfigSet: ReferralProgramEditionConfigSet,
): Promise<void> {
  // Read indexing status once before the loop and reuse for all editions
  const indexingStatus = await indexingStatusCache.read();
  if (indexingStatus instanceof Error) {
    logger.debug(
      { error: indexingStatus },
      "Failed to read indexing status during immutability check",
    );
    return;
  }

  for (const [editionSlug, cache] of caches) {
    // Quick exit: already upgraded to immutable storage
    if (cache.isIndefinitelyStored()) {
      continue;
    }

    const editionConfig = editionConfigSet.get(editionSlug);
    if (!editionConfig) {
      logger.warn({ editionSlug }, "Edition config not found during immutability check");
      continue;
    }

    // Get latest indexed block ref for this edition's chain
    const latestIndexedBlockRef = getLatestIndexedBlockRef(
      indexingStatus,
      editionConfig.rules.subregistryId.chainId,
    );

    if (latestIndexedBlockRef === null) {
      logger.debug(
        { editionSlug, chainId: editionConfig.rules.subregistryId.chainId },
        "No indexed block ref during immutability check",
      );
      continue;
    }

    // Check if edition is immutably closed based on current indexing timestamp
    const isImmutable = assumeReferralProgramEditionImmutablyClosed(
      editionConfig.rules,
      latestIndexedBlockRef.timestamp,
    );

    if (!isImmutable) {
      continue;
    }

    // Atomic check-and-set: prevent concurrent upgrades of the same edition
    const upgradePromise = (() => {
      // Check if upgrade already in progress
      if (inProgressUpgrades.has(editionSlug)) {
        return null;
      }

      // Start upgrade and register promise immediately (no await in between)
      const promise = upgradeEditionCache(editionSlug, cache, editionConfig, caches).finally(() => {
        // Always clean up the in-progress tracking
        inProgressUpgrades.delete(editionSlug);
      });

      inProgressUpgrades.set(editionSlug, promise);
      return promise;
    })();

    if (!upgradePromise) {
      // Another request is already upgrading this edition
      logger.debug({ editionSlug }, "Upgrade already in progress, skipping");
    }

    // Don't await - let upgrade run in background
    // Errors are logged inside upgradeEditionCache
  }
}

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
    checkAndUpgradeImmutableCaches(caches, editionConfigSet).catch((error) => {
      logger.error({ error }, "Failed to check and upgrade immutable caches");
    });

    await next();
  },
);
