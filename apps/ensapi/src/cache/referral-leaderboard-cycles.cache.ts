import config from "@/config";

import {
  type ReferralProgramCycle,
  type ReferralProgramCycleId,
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
 * Map from cycle ID to its leaderboard cache.
 * Each cycle has its own independent cache to preserve successful data
 * even when other cycles fail.
 */
export type ReferralLeaderboardCyclesCacheMap = Map<
  ReferralProgramCycleId,
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
 * @param cycleId - The ID of the cycle to build a cache for
 * @returns A function that builds the leaderboard for the given cycle
 */
function createCycleLeaderboardBuilder(
  cycleId: ReferralProgramCycleId,
): () => Promise<ReferrerLeaderboard> {
  return async (): Promise<ReferrerLeaderboard> => {
    const cycle = config.referralProgramCycleSet.get(cycleId) as ReferralProgramCycle | undefined;
    if (!cycle) {
      throw new Error(`Cycle ${cycleId} not found in referralProgramCycleSet`);
    }

    const indexingStatus = await indexingStatusCache.read();
    if (indexingStatus instanceof Error) {
      logger.error(
        { error: indexingStatus, cycleId },
        `Failed to read indexing status cache while generating referral leaderboard for ${cycleId}. Cannot proceed without valid indexing status.`,
      );
      throw new Error(
        `Unable to generate referral leaderboard for ${cycleId}. indexingStatusCache must have been successfully initialized.`,
      );
    }

    const omnichainIndexingStatus = indexingStatus.omnichainSnapshot.omnichainStatus;
    if (!supportedOmnichainIndexingStatuses.includes(omnichainIndexingStatus)) {
      throw new Error(
        `Unable to generate referrer leaderboard for ${cycleId}. Omnichain indexing status is currently ${omnichainIndexingStatus} but must be ${supportedOmnichainIndexingStatuses.join(" or ")}.`,
      );
    }

    const latestIndexedBlockRef = getLatestIndexedBlockRef(
      indexingStatus,
      cycle.rules.subregistryId.chainId,
    );
    if (latestIndexedBlockRef === null) {
      throw new Error(
        `Unable to generate referrer leaderboard for ${cycleId}. Latest indexed block ref for chain ${cycle.rules.subregistryId.chainId} is null.`,
      );
    }

    logger.info(
      `Building referrer leaderboard for ${cycleId} with rules:\n${JSON.stringify(
        serializeReferralProgramRules(cycle.rules),
        null,
        2,
      )}`,
    );

    const leaderboard = await getReferrerLeaderboard(cycle.rules, latestIndexedBlockRef.timestamp);

    logger.info(
      `Successfully built referrer leaderboard for ${cycleId} with ${leaderboard.referrers.size} referrers`,
    );

    return leaderboard;
  };
}

/**
 * Initializes caches for all configured referral program cycles.
 *
 * Each cycle gets its own independent SWRCache, ensuring that if one cycle
 * fails to refresh, other cycles' previously successful data remains available.
 *
 * @returns A map from cycle ID to its dedicated SWRCache
 */
function initializeCyclesCaches(): ReferralLeaderboardCyclesCacheMap {
  const caches: ReferralLeaderboardCyclesCacheMap = new Map();

  for (const [cycleId] of config.referralProgramCycleSet) {
    const typedCycleId = cycleId as ReferralProgramCycleId;
    const cache = new SWRCache({
      fn: createCycleLeaderboardBuilder(typedCycleId),
      ttl: minutesToSeconds(1),
      proactiveRevalidationInterval: minutesToSeconds(2),
      proactivelyInitialize: true,
    });

    caches.set(typedCycleId, cache);
    logger.info(`Initialized leaderboard cache for ${typedCycleId}`);
  }

  return caches;
}

/**
 * Map of independent caches for each referral program cycle.
 *
 * Each cycle has its own SWRCache to ensure independent failure handling.
 * If cycle 1's cache fails to refresh but was previously successful, its old
 * data remains available while cycle 2 can independently succeed or fail.
 */
export const referralLeaderboardCyclesCaches: ReferralLeaderboardCyclesCacheMap =
  initializeCyclesCaches();
