import config from "@/config";

import {
  hasEnsAnalyticsConfigSupport,
  hasEnsAnalyticsIndexingStatusSupport,
  type ReferralEditionSnapshot,
  type ReferralProgramEditionConfig,
  type ReferralProgramEditionConfigSet,
  type ReferralProgramEditionSlug,
  serializeReferralProgramRules,
} from "@namehash/ens-referrals";
import { minutesToSeconds } from "date-fns";

import { type CachedResult, getLatestIndexedBlockRef, SWRCache } from "@ensnode/ensnode-sdk";

import { assumeReferralProgramEditionImmutablyClosed } from "@/lib/ensanalytics/referrer-leaderboard/closeout";
import { getReferralEditionSnapshot } from "@/lib/ensanalytics/referrer-leaderboard/get-referral-edition-snapshot";
import { makeLogger } from "@/lib/logger";

import { indexingStatusCache } from "./indexing-status.cache";

const logger = makeLogger("referral-edition-snapshots-cache");

/**
 * Map from edition slug to its snapshot cache.
 *
 * Each edition has its own independent cache. Therefore, each
 * edition's cache can be asynchronously loaded / refreshed from
 * others, and a failure to load data for one edition doesn't break
 * data successfully loaded for other editions.
 */
export type ReferralEditionSnapshotsCacheMap = Map<
  ReferralProgramEditionSlug,
  SWRCache<ReferralEditionSnapshot>
>;

/**
 * Creates a cache builder function for a specific edition.
 *
 * The builder function checks if cached data exists and represents an immutably closed edition.
 * If so, it returns the cached data without re-fetching. Otherwise, it fetches fresh data.
 *
 * @param editionConfig - The edition configuration
 * @returns A function that builds the edition snapshot for the given edition
 */
function createEditionSnapshotBuilder(
  editionConfig: ReferralProgramEditionConfig,
): (cachedResult?: CachedResult<ReferralEditionSnapshot>) => Promise<ReferralEditionSnapshot> {
  return async (
    cachedResult?: CachedResult<ReferralEditionSnapshot>,
  ): Promise<ReferralEditionSnapshot> => {
    const editionSlug = editionConfig.slug;

    // Check if cached data is immutable and can be returned as-is
    if (cachedResult && !(cachedResult.result instanceof Error)) {
      const isImmutable = assumeReferralProgramEditionImmutablyClosed(
        cachedResult.result.leaderboard.rules,
        cachedResult.result.leaderboard.accurateAsOf,
      );

      if (isImmutable) {
        logger.debug(
          { editionSlug },
          `Edition is immutably closed, returning cached data without re-fetching`,
        );
        return cachedResult.result;
      }
    }

    // The plugin-support and indexing-status checks below duplicate `ensanalyticsApiMiddleware`'s
    // gates, but are required here because `proactivelyInitialize: true` runs the cache builder
    // at startup — before any request — so the middleware can't gate it. Without these checks,
    // the cache could capture a snapshot derived from a not-yet-final indexer state, or one with
    // silently dropped rows because a required namespace plugin is inactive, and serve it for the
    // rest of its (effectively infinite, for closed editions) TTL.
    const configSupport = hasEnsAnalyticsConfigSupport(config.ensIndexerPublicConfig);
    if (!configSupport.supported) {
      throw new Error(
        `Unable to generate edition snapshot for ${editionSlug}. ${configSupport.reason}`,
      );
    }

    const indexingStatus = await indexingStatusCache.read();
    if (indexingStatus instanceof Error) {
      logger.error(
        { error: indexingStatus, editionSlug },
        `Failed to read indexing status cache while generating edition snapshot for ${editionSlug}. Cannot proceed without valid indexing status.`,
      );
      throw new Error(
        `Unable to generate edition snapshot for ${editionSlug}. indexingStatusCache must have been successfully initialized.`,
      );
    }

    const indexingStatusSupport = hasEnsAnalyticsIndexingStatusSupport(
      indexingStatus.omnichainSnapshot.omnichainStatus,
    );
    if (!indexingStatusSupport.supported) {
      throw new Error(
        `Unable to generate edition snapshot for ${editionSlug}. ${indexingStatusSupport.reason}`,
      );
    }

    const latestIndexedBlockRef = getLatestIndexedBlockRef(
      indexingStatus,
      editionConfig.rules.subregistryId.chainId,
    );
    if (latestIndexedBlockRef === null) {
      throw new Error(
        `Unable to generate edition snapshot for ${editionSlug}. Latest indexed block ref for chain ${editionConfig.rules.subregistryId.chainId} is null.`,
      );
    }

    logger.info(
      `Building edition snapshot for ${editionSlug} with rules:\n${JSON.stringify(
        serializeReferralProgramRules(editionConfig.rules),
        null,
        2,
      )}`,
    );

    const snapshot = await getReferralEditionSnapshot(
      editionConfig.rules,
      latestIndexedBlockRef.timestamp,
    );

    logger.info(
      `Successfully built edition snapshot for ${editionSlug} with ${snapshot.leaderboard.referrers.size} referrers`,
    );

    return snapshot;
  };
}

/**
 * Singleton instance of the initialized caches.
 * Ensures caches are only initialized once per application lifecycle.
 */
let cachedInstance: ReferralEditionSnapshotsCacheMap | null = null;

/**
 * Initializes caches for all referral program editions in the given edition set.
 *
 * This function uses a singleton pattern to ensure caches are only initialized once,
 * even if called multiple times. Each edition gets its own independent SWRCache,
 * ensuring that if one edition fails to refresh, other editions' previously successful
 * data remains available.
 *
 * @param editionConfigSet - The referral program edition config set to initialize caches for
 * @returns A map from edition slug to its dedicated SWRCache
 */
export function initializeReferralEditionSnapshotsCaches(
  editionConfigSet: ReferralProgramEditionConfigSet,
): ReferralEditionSnapshotsCacheMap {
  // Return cached instance if already initialized
  if (cachedInstance !== null) {
    return cachedInstance;
  }

  const caches: ReferralEditionSnapshotsCacheMap = new Map();

  for (const [editionSlug, editionConfig] of editionConfigSet) {
    const cache = new SWRCache({
      fn: createEditionSnapshotBuilder(editionConfig),
      ttl: minutesToSeconds(1),
      proactiveRevalidationInterval: minutesToSeconds(2),
      proactivelyInitialize: true,
    });

    caches.set(editionSlug, cache);
    logger.info(`Initialized edition snapshot cache for ${editionSlug}`);
  }

  // Cache the instance for subsequent calls
  cachedInstance = caches;
  return caches;
}

/**
 * Gets the cached instance of referral edition snapshots caches.
 * Returns null if not yet initialized.
 *
 * @returns The cached cache map or null
 */
export function getReferralEditionSnapshotsCaches(): ReferralEditionSnapshotsCacheMap | null {
  return cachedInstance;
}
