import { publicClients } from "ponder:api";
import { getUnixTime } from "date-fns";

import { buildIndexingStatus } from "./build-index-status";

const MAX_REALTIME_DISTANCE_TO_ACCELERATE = 60; // seconds

/**
 * Determines whether the indexer is near-enough to realtime to plausibly accelerate resolution
 * requests without missing data. If this method returns false, no Protocol Acceleration should be
 * performed, because ENSIndexer is not confident in the recency/truthfulness of its index.
 *
 * @returns whether the indexer is realtime-enough to support acceleration
 */
export async function canAccelerateResolution(): Promise<boolean> {
  try {
    const systemTimestamp = getUnixTime(new Date());
    const indexingStatus = await buildIndexingStatus(publicClients, systemTimestamp);

    // handle case where the indexing projection is unavailable
    if (indexingStatus.type === null) {
      return false;
    }

    return indexingStatus.maxRealtimeDistance <= MAX_REALTIME_DISTANCE_TO_ACCELERATE;
  } catch {
    return false;
  }
}
