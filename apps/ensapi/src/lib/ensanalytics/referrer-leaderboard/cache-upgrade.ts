import type {
  ReferralProgramEditionConfig,
  ReferralProgramEditionConfigSet,
  ReferrerLeaderboard,
} from "@namehash/ens-referrals/v1";
import { minutesToSeconds } from "date-fns";

import {
  type CrossChainIndexingStatusSnapshot,
  getLatestIndexedBlockRef,
  SWRCache,
} from "@ensnode/ensnode-sdk";

import type { ReferralLeaderboardEditionsCacheMap } from "@/cache/referral-leaderboard-editions.cache";
import { createEditionLeaderboardBuilder } from "@/cache/referral-leaderboard-editions.cache";
import { makeLogger } from "@/lib/logger";

import { assumeReferralProgramEditionImmutablyClosed } from "./closeout";

const logger = makeLogger("referral-leaderboard-cache-upgrade");

/**
 * Tracks in-progress cache upgrades to prevent concurrent upgrades of the same edition.
 * Maps edition slug to the upgrade promise.
 */
const inProgressUpgrades = new Map<string, Promise<void>>();

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
export async function upgradeEditionCache(
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

  caches.set(editionSlug, newCache);
  oldCache.destroy();

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
 * @param indexingStatus - The current indexing status snapshot
 */
export function checkAndUpgradeImmutableCaches(
  caches: ReferralLeaderboardEditionsCacheMap,
  editionConfigSet: ReferralProgramEditionConfigSet,
  indexingStatus: CrossChainIndexingStatusSnapshot,
): Promise<void> {
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
      const promise = upgradeEditionCache(editionSlug, cache, editionConfig, caches)
        .catch((error) => {
          logger.error({ editionSlug, error }, "Unexpected error during cache upgrade");
        })
        .finally(() => {
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

  return Promise.resolve();
}
