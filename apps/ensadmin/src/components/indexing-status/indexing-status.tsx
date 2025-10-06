/**
 * This is the main file composing all other ideas into a single UI component
 * that describes overall indexing status across all indexed chains.
 */
"use client";

import {
  ENSIndexerPublicConfig,
  IndexingStatusResponseCodes,
  OmnichainIndexingStatusIds,
  RealtimeIndexingStatusProjection,
} from "@ensnode/ensnode-sdk";
import { type ReactElement, Suspense } from "react";

import { RecentRegistrations } from "@/components/recent-registrations";

import { useENSIndexerConfig, useIndexingStatus } from "@ensnode/ensnode-react";
import { ENSNodeConfigInfo } from "../connection/config-info";
import { BackfillStatus } from "./backfill-status";
import {
  IndexingStatsForSnapshotBackfill,
  IndexingStatsForSnapshotCompleted,
  IndexingStatsForSnapshotFollowing,
  IndexingStatsForSnapshotUnstarted,
  IndexingStatsForUnavailableSnapshot,
  IndexingStatsShell,
} from "./indexing-stats";
import { IndexingStatusLoading } from "./indexing-status-loading";

export function IndexingStatus() {
  const ensIndexerConfigQuery = useENSIndexerConfig();
  const indexingStatusQuery = useIndexingStatus();

  if (ensIndexerConfigQuery.isError) {
    return (
      <ENSNodeConfigInfo
        error={{
          title: "ENSNodeConfigInfo Error",
          description: ensIndexerConfigQuery.error.message,
        }}
      />
    );
  }

  if (indexingStatusQuery.isError) {
    return <p className="p-6">Failed to fetch Indexing Status.</p>;
  }

  if (!ensIndexerConfigQuery.isSuccess || !indexingStatusQuery.isSuccess) {
    return (
      <section className="flex flex-col gap-6 p-6">
        <IndexingStatusLoading />
      </section>
    );
  }

  const ensIndexerConfig = ensIndexerConfigQuery.data;
  const indexingStatus = indexingStatusQuery.data;

  switch (indexingStatus.responseCode) {
    case IndexingStatusResponseCodes.Ok:
      return (
        <IndexingStatsForRealtimeStatusProjection
          ensIndexerConfig={ensIndexerConfig}
          realtimeProjection={indexingStatus.realtimeProjection}
        />
      );
    case IndexingStatusResponseCodes.Error:
      return <IndexingStatsForUnavailableSnapshot />;
  }
}

interface IndexingStatsForRealtimeStatusProjectionProps {
  ensIndexerConfig: ENSIndexerPublicConfig;
  realtimeProjection: RealtimeIndexingStatusProjection;
}

function IndexingStatsForRealtimeStatusProjection({
  ensIndexerConfig,
  realtimeProjection,
}: IndexingStatsForRealtimeStatusProjectionProps) {
  if (!realtimeProjection) {
    return (
      <IndexingStatsShell>
        <IndexingStatsForUnavailableSnapshot />
      </IndexingStatsShell>
    );
  }

  const omnichainStatusSnapshot = realtimeProjection.snapshot.omnichainSnapshot;
  let indexingStats: ReactElement;
  let maybeRecentRegistrations: ReactElement | undefined;
  let maybeIndexingTimeline: ReactElement | undefined;

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

      maybeRecentRegistrations = (
        <Suspense>
          <RecentRegistrations ensIndexerConfig={ensIndexerConfig} />
        </Suspense>
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

      maybeRecentRegistrations = (
        <Suspense>
          <RecentRegistrations ensIndexerConfig={ensIndexerConfig} />
        </Suspense>
      );
      break;
  }

  return (
    <section className="flex flex-col gap-6 p-6">
      {maybeIndexingTimeline}

      <IndexingStatsShell omnichainStatus={omnichainStatusSnapshot.omnichainStatus}>
        {indexingStats}
      </IndexingStatsShell>

      {maybeRecentRegistrations}
    </section>
  );
}
