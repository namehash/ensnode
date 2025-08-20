"use client";

import {
  ENSIndexerOverallIndexingStatus,
  ENSIndexerPublicConfig,
  OverallIndexingStatusIds,
} from "@ensnode/ensnode-sdk";
import { type ReactElement, Suspense } from "react";

import { RecentRegistrations } from "@/components/recent-registrations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { BackfillStatus } from "./backfill-status";
import { ENSIndexerDependencyInfo } from "./dependecy-info";
import {
  IndexingStatsForBackfillStatus,
  IndexingStatsForCompletedStatus,
  IndexingStatsForFollowingStatus,
  IndexingStatsForIndexerErrorStatus,
  IndexingStatsForUnstartedStatus,
  IndexingStatsShell,
} from "./indexing-stats";

interface IndexingStatusDisplayProps {
  ensIndexerConfig: ENSIndexerPublicConfig;
  indexingStatus: ENSIndexerOverallIndexingStatus;
  showRecentRegistrations?: boolean;
}

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

export function IndexingStatusDisplay({
  ensIndexerConfig,
  indexingStatus,
  showRecentRegistrations = false,
}: IndexingStatusDisplayProps) {
  let indexingStats: ReactElement;
  let maybeRecentRegistrations: ReactElement | undefined;
  let maybeIndexingTimeline: ReactElement | undefined;

  switch (indexingStatus.overallStatus) {
    case OverallIndexingStatusIds.IndexerError:
      indexingStats = <IndexingStatsForIndexerErrorStatus />;
      break;

    case OverallIndexingStatusIds.Unstarted:
      indexingStats = (
        <IndexingStatsForUnstartedStatus indexingStatus={indexingStatus} />
      );
      break;

    case OverallIndexingStatusIds.Backfill:
      indexingStats = (
        <IndexingStatsForBackfillStatus indexingStatus={indexingStatus} />
      );

      maybeIndexingTimeline = (
        <BackfillStatus indexingStatus={indexingStatus} />
      );
      break;

    case OverallIndexingStatusIds.Completed:
      indexingStats = (
        <IndexingStatsForCompletedStatus indexingStatus={indexingStatus} />
      );

      if (showRecentRegistrations) {
        maybeRecentRegistrations = (
          <Suspense>
            <RecentRegistrations
              ensIndexerConfig={ensIndexerConfig}
              indexingStatus={indexingStatus}
            />
          </Suspense>
        );
      }
      break;

    case OverallIndexingStatusIds.Following:
      indexingStats = (
        <IndexingStatsForFollowingStatus indexingStatus={indexingStatus} />
      );

      if (showRecentRegistrations) {
        maybeRecentRegistrations = (
          <Suspense>
            <RecentRegistrations
              ensIndexerConfig={ensIndexerConfig}
              indexingStatus={indexingStatus}
            />
          </Suspense>
        );
      }
      break;

    default:
      // This should never happen, but provide fallback
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

export function IndexingStatusWithProps({
  ensIndexerConfig,
  indexingStatus,
  loading = false,
  error = null,
  showRecentRegistrations = true,
}: {
  ensIndexerConfig?: ENSIndexerPublicConfig;
  indexingStatus?: ENSIndexerOverallIndexingStatus;
  loading?: boolean;
  error?: string | null;
  showRecentRegistrations?: boolean;
}) {
  if (error) {
    return <p className="p-6">Failed to fetch data: {error}</p>;
  }

  if (loading || !ensIndexerConfig || !indexingStatus) {
    return <IndexingStatusPlaceholder />;
  }

  return (
    <IndexingStatusDisplay
      ensIndexerConfig={ensIndexerConfig}
      indexingStatus={indexingStatus}
      showRecentRegistrations={showRecentRegistrations}
    />
  );
}
