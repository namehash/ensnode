import type { Duration, UnixTimestamp } from "../shared/types";
import type { CrossChainIndexingStatusSnapshot } from "./cross-chain-indexing-status-snapshot";

/**
 * A "realtime" indexing status projection based on worst-case assumptions
 * from the `snapshot`.
 *
 * Invariants:
 * - `projectedAt` is always >= `snapshot.snapshotTime`.
 * - `worstCaseDistance` is always equal to
 *   `projectedAt - snapshot.slowestChainIndexingCursor`.
 */
export type RealtimeIndexingStatusProjection = {
  /**
   * The timestamp representing "now" as of the time this projection was generated.
   */
  projectedAt: UnixTimestamp;

  /**
   * The distance between `projectedAt` and `snapshot.slowestChainIndexingCursor`.
   *
   * This is "worst-case" because it assumes all of the following:
   * - the `snapshot` (which may have `snapshot.snapshotTime < projectedAt`) is still the
   *   latest snapshot and no indexing progress has been made since `snapshotTime`.
   * - each indexed chain has added a new block as of `projectedAt`.
   */
  worstCaseDistance: Duration;

  /**
   * The {@link CrossChainIndexingStatusSnapshot} that this projection is based on.
   */
  snapshot: CrossChainIndexingStatusSnapshot;
};

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
