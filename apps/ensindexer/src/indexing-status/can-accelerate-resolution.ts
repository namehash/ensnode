import { publicClients } from "ponder:api";
import { buildIndexingStatus } from "@/indexing-status/build-index-status";
import { hasAchievedRequestedDistance } from "@/indexing-status/realtime-indexing-distance";
import { OverallIndexingStatusIds } from "@ensnode/ensnode-sdk";
import { getUnixTime } from "date-fns";

const MAX_REALTIME_DISTANCE_TO_ACCELERATE = 60; // seconds

/**
 * Determines whether the indexer is near-enough to realtime to plausibly accelerate resolution
 * requests without missing data. If this method returns false, no Protocol Acceleration should be
 * performed, because ENSIndexer is not confident in the recency/truthfulness of its index.
 *
 * @returns whether the indexer is realtime-enough to support acceleration
 */
export async function canAccelerateResolution(): Promise<boolean> {
  const systemTimestamp = getUnixTime(new Date());
  const indexingStatus = await buildIndexingStatus(publicClients, systemTimestamp);

  // cannot accelerate if overall status is errored
  if (indexingStatus.overallStatus === OverallIndexingStatusIds.IndexerError) return false;

  const hasAchievedRequestedRealtimeIndexingDistance = hasAchievedRequestedDistance(
    indexingStatus,
    MAX_REALTIME_DISTANCE_TO_ACCELERATE,
  );

  return hasAchievedRequestedRealtimeIndexingDistance;
}
