import {
  type ReferralProgramCycleConfig,
  type ReferralProgramCycleConfigSet,
  type ReferralProgramCycleSlug,
  type ReferrerLeaderboard,
  serializeReferralProgramRules,
} from "@namehash/ens-referrals/v1";
import { minutesToSeconds } from "date-fns";

import {
  getLatestIndexedBlockRef,
  type OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
  SWRCache,
} from "@ensnode/ensnode-sdk";

import { getReferrerLeaderboard } from "@/lib/ensanalytics/referrer-leaderboard/get-referrer-leaderboard-v1";
import { makeLogger } from "@/lib/logger";

import { indexingStatusCache } from "./indexing-status.cache";

const logger = makeLogger("referral-leaderboard-cycles-cache");

/**
 * Map from cycle slug to its leaderboard cache.
 *
 * Each cycle has its own independent cache. Therefore, each
 * cycle's cache can be asynchronously loaded / refreshed from
 * others, and a failure to load data for one cycle doesn't break
 * data successfully loaded for other cycles.
 */
export type ReferralLeaderboardCyclesCacheMap = Map<
  ReferralProgramCycleSlug,
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
 * Creates a cache builder function for a specific cycle.
 *
 * @param cycleConfig - The cycle configuration
 * @returns A function that builds the leaderboard for the given cycle
 */
function createCycleLeaderboardBuilder(
  cycleConfig: ReferralProgramCycleConfig,
): () => Promise<ReferrerLeaderboard> {
  return async (): Promise<ReferrerLeaderboard> => {
    const cycleSlug = cycleConfig.slug;

    const indexingStatus = await indexingStatusCache.read();
    if (indexingStatus instanceof Error) {
      logger.error(
        { error: indexingStatus, cycleSlug },
        `Failed to read indexing status cache while generating referral leaderboard for ${cycleSlug}. Cannot proceed without valid indexing status.`,
      );
      throw new Error(
        `Unable to generate referral leaderboard for ${cycleSlug}. indexingStatusCache must have been successfully initialized.`,
      );
    }

    const omnichainIndexingStatus = indexingStatus.omnichainSnapshot.omnichainStatus;
    if (!supportedOmnichainIndexingStatuses.includes(omnichainIndexingStatus)) {
      throw new Error(
        `Unable to generate referrer leaderboard for ${cycleSlug}. Omnichain indexing status is currently ${omnichainIndexingStatus} but must be ${supportedOmnichainIndexingStatuses.join(" or ")}.`,
      );
    }

    const latestIndexedBlockRef = getLatestIndexedBlockRef(
      indexingStatus,
      cycleConfig.rules.subregistryId.chainId,
    );
    if (latestIndexedBlockRef === null) {
      throw new Error(
        `Unable to generate referrer leaderboard for ${cycleSlug}. Latest indexed block ref for chain ${cycleConfig.rules.subregistryId.chainId} is null.`,
      );
    }

    logger.info(
      `Building referrer leaderboard for ${cycleSlug} with rules:\n${JSON.stringify(
        serializeReferralProgramRules(cycleConfig.rules),
        null,
        2,
      )}`,
    );

    const leaderboard = await getReferrerLeaderboard(
      cycleConfig.rules,
      latestIndexedBlockRef.timestamp,
    );

    logger.info(
      `Successfully built referrer leaderboard for ${cycleSlug} with ${leaderboard.referrers.size} referrers`,
    );

    return leaderboard;
  };
}

/**
 * Singleton instance of the initialized caches.
 * Ensures caches are only initialized once per application lifecycle.
 */
let cachedInstance: ReferralLeaderboardCyclesCacheMap | null = null;

/**
 * Initializes caches for all referral program cycles in the given cycle set.
 *
 * This function uses a singleton pattern to ensure caches are only initialized once,
 * even if called multiple times. Each cycle gets its own independent SWRCache,
 * ensuring that if one cycle fails to refresh, other cycles' previously successful
 * data remains available.
 *
 * @param cycleConfigSet - The referral program cycle config set to initialize caches for
 * @returns A map from cycle slug to its dedicated SWRCache
 */
export function initializeReferralLeaderboardCyclesCaches(
  cycleConfigSet: ReferralProgramCycleConfigSet,
): ReferralLeaderboardCyclesCacheMap {
  // Return cached instance if already initialized
  if (cachedInstance !== null) {
    return cachedInstance;
  }

  const caches: ReferralLeaderboardCyclesCacheMap = new Map();

  for (const [cycleSlug, cycleConfig] of cycleConfigSet) {
    const cache = new SWRCache({
      fn: createCycleLeaderboardBuilder(cycleConfig),
      ttl: minutesToSeconds(1),
      proactiveRevalidationInterval: minutesToSeconds(2),
      proactivelyInitialize: true,
    });

    caches.set(cycleSlug, cache);
    logger.info(`Initialized leaderboard cache for ${cycleSlug}`);
  }

  // Cache the instance for subsequent calls
  cachedInstance = caches;
  return caches;
}

/**
 * Gets the cached instance of referral leaderboard cycles caches.
 * Returns null if not yet initialized.
 *
 * @returns The cached cache map or null
 */
export function getReferralLeaderboardCyclesCaches(): ReferralLeaderboardCyclesCacheMap | null {
  return cachedInstance;
}
