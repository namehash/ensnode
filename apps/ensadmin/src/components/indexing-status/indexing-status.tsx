/**
 * This is the main file composing all other ideas into a single UI component
 * that describes overall indexing status across all indexed chains.
 */
"use client";

import { OverallIndexingStatusIds } from "@ensnode/ensnode-sdk";
import { type ReactElement, Suspense } from "react";

import { RecentRegistrations } from "@/components/recent-registrations";

import { useENSIndexerConfig, useIndexingStatus } from "@ensnode/ensnode-react";
import { BackfillStatus } from "./backfill-status";
import { ENSIndexerDependencyInfo } from "./dependecy-info";
import {
  IndexingStatsForBackfillStatus,
  IndexingStatsForCompletedStatus,
  IndexingStatsForFollowingStatus,
  IndexingStatsForIndexerErrorStatus,
  IndexingStatsForQueuedStatus,
  IndexingStatsShell,
} from "./indexing-stats";
import { IndexingStatusPlaceholder } from "./indexing-status-placeholder";

export function IndexingStatus() {
  const ensIndexerConfigQuery = useENSIndexerConfig();
  const indexingStatusQuery = useIndexingStatus();

  if (ensIndexerConfigQuery.isError) {
    return <p className="p-6">Failed to fetch ENSIndexer Config.</p>;
  }
  if (indexingStatusQuery.isError) {
    return <p className="p-6">Failed to fetch Indexing Status.</p>;
  }

  if (!ensIndexerConfigQuery.isSuccess || !indexingStatusQuery.isSuccess) {
    return <IndexingStatusPlaceholder />;
  }

  const ensIndexerConfig = ensIndexerConfigQuery.data;
  const indexingStatus = indexingStatusQuery.data;

  let indexingStats: ReactElement;
  let maybeRecentRegistrations: ReactElement | undefined;
  let maybeIndexingTimeline: ReactElement | undefined;

  switch (indexingStatus.overallStatus) {
    case OverallIndexingStatusIds.IndexerError:
      indexingStats = <IndexingStatsForIndexerErrorStatus />;
      break;

    case OverallIndexingStatusIds.Queued:
      indexingStats = <IndexingStatsForQueuedStatus indexingStatus={indexingStatus} />;
      break;

    case OverallIndexingStatusIds.Backfill:
      indexingStats = <IndexingStatsForBackfillStatus indexingStatus={indexingStatus} />;

      maybeIndexingTimeline = <BackfillStatus indexingStatus={indexingStatus} />;
      break;

    case OverallIndexingStatusIds.Completed:
      indexingStats = <IndexingStatsForCompletedStatus indexingStatus={indexingStatus} />;

      maybeRecentRegistrations = (
        <Suspense>
          <RecentRegistrations
            ensIndexerConfig={ensIndexerConfig}
            indexingStatus={indexingStatus}
          />
        </Suspense>
      );
      break;

    case OverallIndexingStatusIds.Following:
      indexingStats = <IndexingStatsForFollowingStatus indexingStatus={indexingStatus} />;

      maybeRecentRegistrations = (
        <Suspense>
          <RecentRegistrations
            ensIndexerConfig={ensIndexerConfig}
            indexingStatus={indexingStatus}
          />
        </Suspense>
      );
      break;

    case OverallIndexingStatusIds.IndexerError:
      indexingStats = <IndexingStatsForIndexerErrorStatus />;
  }

  return (
    <section className="flex flex-col gap-6 p-6">
      <ENSIndexerDependencyInfo ensIndexerConfig={ensIndexerConfig} />

      {maybeIndexingTimeline}

      <IndexingStatsShell overallStatus={indexingStatus.overallStatus}>
        {indexingStats}
      </IndexingStatsShell>

      {maybeRecentRegistrations}
    </section>
  );
}
