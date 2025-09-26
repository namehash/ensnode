// Temporary mock page until indexing-status is detached from data loading
"use client";

import { OmnichainIndexingSnapshot, OmnichainIndexingStatusIds } from "@ensnode/ensnode-sdk";
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
  indexingSnapshot: OmnichainIndexingSnapshot | null;
}

export function MockIndexingStatusDisplay({
  indexingSnapshot,
}: MockIndexingStatusDisplayPropsProps) {
  let indexingStats: ReactElement;
  let maybeIndexingTimeline: ReactElement | undefined;

  switch (indexingSnapshot?.omnichainStatus) {
    case OmnichainIndexingStatusIds.Unstarted:
      indexingStats = <IndexingStatsForSnapshotUnstarted indexingSnapshot={indexingSnapshot} />;
      break;

    case OmnichainIndexingStatusIds.Backfill:
      indexingStats = <IndexingStatsForSnapshotBackfill indexingSnapshot={indexingSnapshot} />;

      maybeIndexingTimeline = <BackfillStatus indexingSnapshot={indexingSnapshot} />;
      break;

    case OmnichainIndexingStatusIds.Completed:
      indexingStats = <IndexingStatsForSnapshotCompleted indexingSnapshot={indexingSnapshot} />;
      break;

    case OmnichainIndexingStatusIds.Following:
      indexingStats = <IndexingStatsForSnapshotFollowing indexingSnapshot={indexingSnapshot} />;
      break;

    default:
      indexingStats = <IndexingStatsForUnavailableSnapshot />;
  }

  return (
    <>
      {maybeIndexingTimeline}

      <IndexingStatsShell omnichainStatus={indexingSnapshot?.omnichainStatus}>
        {indexingStats}
      </IndexingStatsShell>
    </>
  );
}

export function MockIndexingStatusDisplayWithProps({
  indexingSnapshot,
  loading = false,
  error = null,
}: {
  indexingSnapshot?: OmnichainIndexingSnapshot;
  loading?: boolean;
  error?: string | null;
}) {
  if (error) {
    return <p className="p-6">Failed to fetch data: {error}</p>;
  }

  if (loading || !indexingSnapshot) {
    return <IndexingStatusLoading />;
  }

  return <MockIndexingStatusDisplay indexingSnapshot={indexingSnapshot} />;
}
