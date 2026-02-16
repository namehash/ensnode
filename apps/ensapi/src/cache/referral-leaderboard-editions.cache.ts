import {
  type ReferralProgramEditionConfig,
  type ReferralProgramEditionConfigSet,
  type ReferralProgramEditionSlug,
  type ReferrerLeaderboard,
  serializeReferralProgramRules,
} from "@namehash/ens-referrals/v1";
import { minutesToSeconds } from "date-fns";

import {
  type CachedResult,
  getLatestIndexedBlockRef,
  type OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
  SWRCache,
} from "@ensnode/ensnode-sdk";

import { assumeReferralProgramEditionImmutablyClosed } from "@/lib/ensanalytics/referrer-leaderboard/closeout";
import { getReferrerLeaderboard } from "@/lib/ensanalytics/referrer-leaderboard/get-referrer-leaderboard-v1";
import { makeLogger } from "@/lib/logger";

import { indexingStatusCache } from "./indexing-status.cache";

const logger = makeLogger("referral-leaderboard-editions-cache");

/**
 * Map from edition slug to its leaderboard cache.
 *
 * Each edition has its own independent cache. Therefore, each
 * edition's cache can be asynchronously loaded / refreshed from
 * others, and a failure to load data for one edition doesn't break
 * data successfully loaded for other editions.
 */
export type ReferralLeaderboardEditionsCacheMap = Map<
  ReferralProgramEditionSlug,
  SWRCache<ReferrerLeaderboard>
>;

/**
 * The list of {@link OmnichainIndexingStatusId} values that are supported for generating
 * referrer leaderboards.
 *
 * Other values indicate that we are not ready to generate leaderboards yet.
 */
const supportedOmnichainIndexingStatuses: OmnichainIndexingStatusId[] = [
  OmnichainIndexingStatusIds.Following,
  OmnichainIndexingStatusIds.Completed,
];

/**
 * Creates a cache builder function for a specific edition.
 *
 * The builder function checks if cached data exists and represents an immutably closed edition.
 * If so, it returns the cached data without re-fetching. Otherwise, it fetches fresh data.
 *
 * @param editionConfig - The edition configuration
 * @returns A function that builds the leaderboard for the given edition
 */
function createEditionLeaderboardBuilder(
  editionConfig: ReferralProgramEditionConfig,
): (cachedResult?: CachedResult<ReferrerLeaderboard>) => Promise<ReferrerLeaderboard> {
  return async (cachedResult?: CachedResult<ReferrerLeaderboard>): Promise<ReferrerLeaderboard> => {
    const editionSlug = editionConfig.slug;

    // Check if cached data is immutable and can be returned as-is
    if (cachedResult && !(cachedResult.result instanceof Error)) {
      const isImmutable = assumeReferralProgramEditionImmutablyClosed(
        cachedResult.result.rules,
        cachedResult.result.accurateAsOf,
      );

      if (isImmutable) {
        logger.debug(
          { editionSlug },
          `Edition is immutably closed, returning cached data without re-fetching`,
        );
        return cachedResult.result;
      }
    }

    const indexingStatus = await indexingStatusCache.read();
    if (indexingStatus instanceof Error) {
      logger.error(
        { error: indexingStatus, editionSlug },
        `Failed to read indexing status cache while generating referral leaderboard for ${editionSlug}. Cannot proceed without valid indexing status.`,
      );
      throw new Error(
        `Unable to generate referral leaderboard for ${editionSlug}. indexingStatusCache must have been successfully initialized.`,
      );
    }

    const omnichainIndexingStatus = indexingStatus.omnichainSnapshot.omnichainStatus;
    if (!supportedOmnichainIndexingStatuses.includes(omnichainIndexingStatus)) {
      throw new Error(
        `Unable to generate referrer leaderboard for ${editionSlug}. Omnichain indexing status is currently ${omnichainIndexingStatus} but must be ${supportedOmnichainIndexingStatuses.join(" or ")}.`,
      );
    }

    const latestIndexedBlockRef = getLatestIndexedBlockRef(
      indexingStatus,
      editionConfig.rules.subregistryId.chainId,
    );
    if (latestIndexedBlockRef === null) {
      throw new Error(
        `Unable to generate referrer leaderboard for ${editionSlug}. Latest indexed block ref for chain ${editionConfig.rules.subregistryId.chainId} is null.`,
      );
    }

    logger.info(
      `Building referrer leaderboard for ${editionSlug} with rules:\n${JSON.stringify(
        serializeReferralProgramRules(editionConfig.rules),
        null,
        2,
      )}`,
    );

    const leaderboard = await getReferrerLeaderboard(
      editionConfig.rules,
      latestIndexedBlockRef.timestamp,
    );

    logger.info(
      `Successfully built referrer leaderboard for ${editionSlug} with ${leaderboard.referrers.size} referrers`,
    );

    return leaderboard;
  };
}

/**
 * Singleton instance of the initialized caches.
 * Ensures caches are only initialized once per application lifecycle.
 */
let cachedInstance: ReferralLeaderboardEditionsCacheMap | null = null;

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
export function initializeReferralLeaderboardEditionsCaches(
  editionConfigSet: ReferralProgramEditionConfigSet,
): ReferralLeaderboardEditionsCacheMap {
  // Return cached instance if already initialized
  if (cachedInstance !== null) {
    return cachedInstance;
  }

  const caches: ReferralLeaderboardEditionsCacheMap = new Map();

  for (const [editionSlug, editionConfig] of editionConfigSet) {
    const cache = new SWRCache({
      fn: createEditionLeaderboardBuilder(editionConfig),
      ttl: minutesToSeconds(1),
      proactiveRevalidationInterval: minutesToSeconds(2),
      proactivelyInitialize: true,
    });

    caches.set(editionSlug, cache);
    logger.info(`Initialized leaderboard cache for ${editionSlug}`);
  }

  // Cache the instance for subsequent calls
  cachedInstance = caches;
  return caches;
}

/**
 * Gets the cached instance of referral leaderboard editions caches.
 * Returns null if not yet initialized.
 *
 * @returns The cached cache map or null
 */
export function getReferralLeaderboardEditionsCaches(): ReferralLeaderboardEditionsCacheMap | null {
  return cachedInstance;
}
