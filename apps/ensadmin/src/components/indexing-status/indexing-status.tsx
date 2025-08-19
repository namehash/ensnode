/**
 * This is the main file composing all other ideas into a single UI component
 * that describes overall indexing status across all indexed chains.
 */
"use client";

import { OverallIndexingStatusIds } from "@ensnode/ensnode-sdk";
import { type ReactElement, Suspense } from "react";

import { useENSIndexerConfig, useIndexingStatus } from "@/components/ensindexer/hooks";
import { RecentRegistrations } from "@/components/recent-registrations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { BackfillStatusTimeline } from "./backfill-status-timeline";
import { ENSIndexerDependencyInfo } from "./dependecy-info";
import {
  IndexingStatsForBackfillStatus,
  IndexingStatsForCompletedStatus,
  IndexingStatsForFollowingStatus,
  IndexingStatsForIndexerErrorStatus,
  IndexingStatsForUnstartedStatus,
  IndexingStatsShell,
} from "./indexing-stats";

/**
 * Component to display a placeholder for the indexing status.
 */
function IndexingStatusPlaceholder() {
  return (
    <section className="flex flex-col gap-6 p-6">
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

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
  let maybeIndexingProgressTimeline: ReactElement | undefined;

  switch (indexingStatus.overallStatus) {
    case OverallIndexingStatusIds.IndexerError:
      indexingStats = <IndexingStatsForIndexerErrorStatus />;
      break;

    case OverallIndexingStatusIds.Unstarted:
      indexingStats = <IndexingStatsForUnstartedStatus indexingStatus={indexingStatus} />;
      break;

    case OverallIndexingStatusIds.Backfill:
      indexingStats = <IndexingStatsForBackfillStatus indexingStatus={indexingStatus} />;

      maybeIndexingProgressTimeline = <BackfillStatusTimeline indexingStatus={indexingStatus} />;
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

      {maybeIndexingProgressTimeline}

      <IndexingStatsShell overallStatus={indexingStatus.overallStatus}>
        {indexingStats}
      </IndexingStatsShell>

      {maybeRecentRegistrations}
    </section>
  );
}
