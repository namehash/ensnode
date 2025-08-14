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
export function hasAchievedRequestedDistance(
  indexingStatus: ENSIndexerOverallIndexingStatus,
  requestedRealtimeIndexingDistance: Duration | undefined,
): boolean {
  return (
    typeof requestedRealtimeIndexingDistance === "undefined" ||
    (indexingStatus.overallStatus === OverallIndexingStatusIds.Following &&
      indexingStatus.overallApproxRealtimeDistance <= requestedRealtimeIndexingDistance)
  );
}
