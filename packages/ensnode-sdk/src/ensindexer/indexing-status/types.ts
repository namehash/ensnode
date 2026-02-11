import type { Duration, UnixTimestamp } from "../../shared/types";
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
