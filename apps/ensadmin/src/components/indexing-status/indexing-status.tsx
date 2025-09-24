/**
 * This is the main file composing all other ideas into a single UI component
 * that describes overall indexing status across all indexed chains.
 */
"use client";

import { OmnichainIndexingStatusIds } from "@ensnode/ensnode-sdk";
import { type ReactElement, Suspense } from "react";

import { RecentRegistrations } from "@/components/recent-registrations";

import { useENSIndexerConfig, useIndexingStatus } from "@ensnode/ensnode-react";
import { BackfillStatus } from "./backfill-status";
import { ENSNodeConfigInfo } from "./config-info";
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
        <ENSNodeConfigInfo /> {/*display loading state*/}
        <IndexingStatusLoading />
      </section>
    );
  }

  const ensIndexerConfig = ensIndexerConfigQuery.data;
  const indexingStatus = indexingStatusQuery.data;

  if (indexingStatus.snapshot === null) {
    return <IndexingStatsForUnavailableSnapshot />;
  }

  let indexingStats: ReactElement;
  let maybeRecentRegistrations: ReactElement | undefined;
  let maybeIndexingTimeline: ReactElement | undefined;

  switch (indexingStatus.snapshot.omnichainStatus) {
    case OmnichainIndexingStatusIds.Unstarted:
      indexingStats = (
        <IndexingStatsForSnapshotUnstarted indexingSnapshot={indexingStatus.snapshot} />
      );
      break;

    case OmnichainIndexingStatusIds.Backfill:
      indexingStats = (
        <IndexingStatsForSnapshotBackfill indexingSnapshot={indexingStatus.snapshot} />
      );

      maybeIndexingTimeline = <BackfillStatus indexingSnapshot={indexingStatus.snapshot} />;
      break;

    case OmnichainIndexingStatusIds.Completed:
      indexingStats = (
        <IndexingStatsForSnapshotCompleted indexingSnapshot={indexingStatus.snapshot} />
      );

      maybeRecentRegistrations = (
        <Suspense>
          <RecentRegistrations ensIndexerConfig={ensIndexerConfig} />
        </Suspense>
      );
      break;

    case OmnichainIndexingStatusIds.Following:
      indexingStats = (
        <IndexingStatsForSnapshotFollowing indexingSnapshot={indexingStatus.snapshot} />
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
      <ENSNodeConfigInfo ensIndexerConfig={ensIndexerConfig} />

      {maybeIndexingTimeline}

      <IndexingStatsShell omnichainStatus={indexingStatus.snapshot?.omnichainStatus}>
        {indexingStats}
      </IndexingStatsShell>

      {maybeRecentRegistrations}
    </section>
  );
}
