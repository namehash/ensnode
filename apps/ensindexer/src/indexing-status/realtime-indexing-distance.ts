/**
 * Realtime Indexing Distance
 *
 * This file includes ideas and functionality checking the realtime indexing distance.
 */

import {
  type Duration,
  type ENSIndexerOverallIndexingStatus,
  OverallIndexingStatusIds,
} from "@ensnode/ensnode-sdk";

/**
 * Checks if the requested realtime indexing distance was achieved.
 */
export function hasAchievedRealtimeIndexingDistance(
  indexingStatus: ENSIndexerOverallIndexingStatus,
  requestedRealtimeIndexingDistance: Duration,
): boolean {
  if (indexingStatus.overallStatus !== OverallIndexingStatusIds.Following) {
    return false;
  }

  const hasNotAchievedRequestedRealtimeIndexingDistance =
    indexingStatus.overallApproxRealtimeDistance > requestedRealtimeIndexingDistance;

  if (hasNotAchievedRequestedRealtimeIndexingDistance) {
    return false;
  }

  return true;
}
