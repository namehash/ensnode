import { UnixTimestamp } from "../../shared";
import {
  CurrentIndexingProjection,
  CurrentIndexingProjectionOmnichain,
  CurrentIndexingProjectionUnavailable,
  OmnichainIndexingSnapshot,
} from "./types";

/**
 * Create current indexing projection from
 * omnichain indexing snapshot (if available).
 */
export function createProjection(
  snapshot: OmnichainIndexingSnapshot | null,
  now: UnixTimestamp,
): CurrentIndexingProjection {
  if (snapshot === null) {
    return {
      type: null,
      realtime: now,
      maxRealtimeDistance: null,
      snapshot: null,
    } satisfies CurrentIndexingProjectionUnavailable;
  }

  const realtime = Math.max(now, snapshot.snapshotTime);

  return {
    type: "omnichain",
    realtime,
    maxRealtimeDistance: realtime - snapshot.omnichainIndexingCursor,
    snapshot,
  } satisfies CurrentIndexingProjectionOmnichain;
}
