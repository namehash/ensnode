// Temporary mock page until indexing-status is detached from data loading
"use client";

import {
  OmnichainIndexingStatusIds,
  OmnichainIndexingStatusSnapshot,
  RealtimeIndexingStatusProjection,
} from "@ensnode/ensnode-sdk";
import { type ReactElement } from "react";

import { BackfillStatus } from "@/components/indexing-status/backfill-status";
import {
  IndexingStatsForSnapshotBackfill,
  IndexingStatsForSnapshotCompleted,
  IndexingStatsForSnapshotFollowing,
  IndexingStatsForSnapshotUnstarted,
  IndexingStatsForUnavailableSnapshot,
  IndexingStatsShell,
} from "@/components/indexing-status/indexing-stats";
import { IndexingStatusLoading } from "@/components/indexing-status/indexing-status-loading";

interface MockIndexingStatusDisplayPropsProps {
  realtimeProjection: RealtimeIndexingStatusProjection | null;
}

export function MockIndexingStatusDisplay({
  realtimeProjection,
}: MockIndexingStatusDisplayPropsProps) {
  let indexingStats: ReactElement;
  let maybeIndexingTimeline: ReactElement | undefined;

  if (!realtimeProjection) {
    return (
      <IndexingStatsShell>
        <IndexingStatsForUnavailableSnapshot />
      </IndexingStatsShell>
    );
  }

  const omnichainStatusSnapshot = realtimeProjection.snapshot.omnichainSnapshot;

  switch (omnichainStatusSnapshot.omnichainStatus) {
    case OmnichainIndexingStatusIds.Unstarted:
      indexingStats = (
        <IndexingStatsForSnapshotUnstarted
          realtimeProjection={{
            ...realtimeProjection,
            snapshot: {
              ...realtimeProjection.snapshot,
              omnichainSnapshot: omnichainStatusSnapshot,
            },
          }}
        />
      );
      break;

    case OmnichainIndexingStatusIds.Backfill:
      indexingStats = (
        <IndexingStatsForSnapshotBackfill
          realtimeProjection={{
            ...realtimeProjection,
            snapshot: {
              ...realtimeProjection.snapshot,
              omnichainSnapshot: omnichainStatusSnapshot,
            },
          }}
        />
      );

      maybeIndexingTimeline = (
        <BackfillStatus
          realtimeProjection={{
            ...realtimeProjection,
            snapshot: {
              ...realtimeProjection.snapshot,
              omnichainSnapshot: omnichainStatusSnapshot,
            },
          }}
        />
      );
      break;

    case OmnichainIndexingStatusIds.Completed:
      indexingStats = (
        <IndexingStatsForSnapshotCompleted
          realtimeProjection={{
            ...realtimeProjection,
            snapshot: {
              ...realtimeProjection.snapshot,
              omnichainSnapshot: omnichainStatusSnapshot,
            },
          }}
        />
      );
      break;

    case OmnichainIndexingStatusIds.Following:
      indexingStats = (
        <IndexingStatsForSnapshotFollowing
          realtimeProjection={{
            ...realtimeProjection,
            snapshot: {
              ...realtimeProjection.snapshot,
              omnichainSnapshot: omnichainStatusSnapshot,
            },
          }}
        />
      );
      break;
  }

  return (
    <>
      {maybeIndexingTimeline}

      <IndexingStatsShell omnichainStatus={omnichainStatusSnapshot.omnichainStatus}>
        {indexingStats}
      </IndexingStatsShell>
    </>
  );
}

export function MockIndexingStatusDisplayWithProps({
  realtimeProjection,
  loading = false,
  error = null,
}: {
  realtimeProjection?: RealtimeIndexingStatusProjection;
  loading?: boolean;
  error?: string | null;
}) {
  if (error) {
    return <p className="p-6">Failed to fetch data: {error}</p>;
  }

  if (loading || !realtimeProjection) {
    return <IndexingStatusLoading />;
  }

  return <MockIndexingStatusDisplay realtimeProjection={realtimeProjection} />;
}
