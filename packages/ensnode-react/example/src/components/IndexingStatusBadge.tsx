import type { Duration, UnixTimestamp } from "enssdk";

import { useIndexingStatus } from "@ensnode/ensnode-react";
import { EnsApiIndexingStatusResponseCodes } from "@ensnode/ensnode-sdk";

function formatWorstCaseDistance(distance: Duration): string {
  if (distance <= 60) return `${distance}s behind`;
  if (distance <= 60 * 60) return `${Math.round(distance / 60)}m behind`;
  if (distance <= 60 * 60 * 24) return `${Math.round(distance / (60 * 60))}h behind`;
  return `${Math.round(distance / (60 * 60 * 24))}d behind`;
}

function formatSnapshotAge(snapshotTime: UnixTimestamp, now: UnixTimestamp): string {
  const age = Math.max(0, now - snapshotTime);
  if (age < 60) return `${age}s ago`;
  if (age < 60 * 60) return `${Math.round(age / 60)}m ago`;
  return `${Math.round(age / (60 * 60))}h ago`;
}

/**
 * Compact indexing-status indicator inspired by the ENSAdmin `ProjectionInfo` info-icon.
 *
 * Polls the connected ENSNode's `/api/indexing-status` endpoint (via
 * `useIndexingStatus`) and renders the worst-case projection distance plus
 * snapshot freshness so consumers can see at a glance how far behind realtime
 * the connected ENSNode is.
 */
export function IndexingStatusBadge() {
  const { data, isLoading, error } = useIndexingStatus();

  if (isLoading) {
    return <output aria-live="polite">Indexing status: loading…</output>;
  }

  if (error) {
    return <output aria-live="polite">Indexing status: unavailable</output>;
  }

  if (!data || data.responseCode !== EnsApiIndexingStatusResponseCodes.Ok) {
    return <output aria-live="polite">Indexing status: unavailable</output>;
  }

  const { projectedAt, worstCaseDistance, snapshot } = data.realtimeProjection;

  return (
    <output
      aria-live="polite"
      title={`Snapshot captured ${formatSnapshotAge(snapshot.snapshotTime, projectedAt)}`}
    >
      Indexing status: {formatWorstCaseDistance(worstCaseDistance)} (snapshot{" "}
      {formatSnapshotAge(snapshot.snapshotTime, projectedAt)})
    </output>
  );
}
