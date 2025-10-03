import type { UnixTimestamp } from "../../shared";
import type { CrossChainIndexingStatusSnapshot, RealtimeIndexingStatusProjection } from "./types";

/**
 * Create realtime indexing status projection from
 * omnichain indexing status snapshot.
 */
export function createRealtimeStatusProjection(
  snapshot: CrossChainIndexingStatusSnapshot,
  now: UnixTimestamp,
): RealtimeIndexingStatusProjection {
  const projectedAt = Math.max(now, snapshot.snapshotTime);

  return {
    projectedAt,
    worstCaseDistance: projectedAt - snapshot.slowestChainIndexingCursor,
    snapshot,
  } satisfies RealtimeIndexingStatusProjection;
}
