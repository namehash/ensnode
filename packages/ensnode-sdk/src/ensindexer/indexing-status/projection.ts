import type { UnixTimestamp } from "../../shared";
import type { CrossChainIndexingStatusSnapshot, RealtimeIndexingStatusProjection } from "./types";

/**
 * Create realtime indexing status projection from
 * a {@link CrossChainIndexingStatusSnapshot}.
 */
export function createRealtimeIndexingStatusProjection(
  snapshot: CrossChainIndexingStatusSnapshot,
  now: UnixTimestamp,
): RealtimeIndexingStatusProjection {
  /**
   * The timestamp when the realtime indexing status was projected.
   *
   * Due to possible clock skew between different systems,
   * if the "now" timestamp on the system generating this indexing status
   * projection is less than the snapshot time, then this value must be set to
   * equal to the whichever is higher between the `now` and
   * the snapshot time to ensure all invariants are followed.
   */
  const projectedAt = Math.max(now, snapshot.snapshotTime);

  return {
    projectedAt,
    worstCaseDistance: projectedAt - snapshot.slowestChainIndexingCursor,
    snapshot,
  };
}
