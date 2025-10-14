import { publicClients } from "ponder:api";
import { getUnixTime } from "date-fns";

import {
  type Duration,
  type OmnichainIndexingStatusSnapshot,
  createRealtimeIndexingStatusProjection,
} from "@ensnode/ensnode-sdk";
import {
  buildOmnichainIndexingStatusSnapshot,
  createCrossChainIndexingStatusSnapshotOmnichain,
} from "./build-index-status";

const MAX_REALTIME_DISTANCE_TO_ACCELERATE: Duration = 60; // seconds

/**
 * Determines whether the indexer is near-enough to realtime to plausibly accelerate resolution
 * requests without missing data. If this method returns false, no Protocol Acceleration should be
 * performed, because ENSIndexer is not confident in the recency/truthfulness of its index.
 *
 * @returns whether the indexer is realtime-enough to support acceleration
 */
export async function canAccelerateResolution(): Promise<boolean> {
  try {
    // get system timestamp for the current request
    const snapshotTime = getUnixTime(new Date());

    let omnichainSnapshot: OmnichainIndexingStatusSnapshot | undefined;

    try {
      omnichainSnapshot = await buildOmnichainIndexingStatusSnapshot(publicClients);
    } catch (error) {
      return false;
    }

    // otherwise, proceed with creating IndexingStatusResponseOk
    const crossChainSnapshot = createCrossChainIndexingStatusSnapshotOmnichain(
      omnichainSnapshot,
      snapshotTime,
    );

    const projectedAt = getUnixTime(new Date());
    const realtimeProjection = createRealtimeIndexingStatusProjection(
      crossChainSnapshot,
      projectedAt,
    );

    return realtimeProjection.worstCaseDistance <= MAX_REALTIME_DISTANCE_TO_ACCELERATE;
  } catch {
    return false;
  }
}
