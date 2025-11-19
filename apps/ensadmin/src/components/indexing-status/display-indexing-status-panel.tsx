import { memo, PropsWithChildren, ReactElement } from "react";

import { OmnichainIndexingStatusId, OmnichainIndexingStatusIds } from "@ensnode/ensnode-sdk";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatOmnichainIndexingStatus } from "@/lib/indexing-status";
import { cn } from "@/lib/utils";

import { BackfillStatus } from "./backfill-status";
import {
  buildIndexingStatsProps,
  IndexingStatsForSnapshotBackfill,
  IndexingStatsForSnapshotCompleted,
  IndexingStatsForSnapshotFollowing,
  IndexingStatsForSnapshotUnstarted,
} from "./indexing-stats";
import { IndexingStatusLoading } from "./indexing-status-loading";
import { StatefulFetchIndexingStatus, StatefulFetchStatusIds } from "./types";

/**
 * Indexing Stats Shell
 *
 * UI component for presenting indexing stats UI for specific overall status.
 */
export function IndexingStatsShell({
  title,
  omnichainStatus,
  children,
}: PropsWithChildren<{ title: string; omnichainStatus?: OmnichainIndexingStatusId }>) {
  return (
    <Card className="w-full flex flex-col gap-2">
      <CardHeader>
        <CardTitle className="flex gap-2 items-center">
          <span>{title}</span>

          {omnichainStatus && (
            <Badge
              className={cn("uppercase text-xs leading-none")}
              title={`Omnichain indexing status: ${formatOmnichainIndexingStatus(omnichainStatus)}`}
            >
              {formatOmnichainIndexingStatus(omnichainStatus)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-8">
        <section className="grid gap-8 grid-cols-1 sm:grid-cols-2">{children}</section>
      </CardContent>
    </Card>
  );
}

interface DisplayIndexingStatusPanelProps {
  title: string;
  indexingStatus: StatefulFetchIndexingStatus;
}

export function DisplayIndexingStatusPanel({
  indexingStatus,
  title,
}: DisplayIndexingStatusPanelProps) {
  switch (indexingStatus.fetchStatus) {
    case StatefulFetchStatusIds.Connecting:
    case StatefulFetchStatusIds.Loading:
      return (
        <IndexingStatsShell title={title}>
          <IndexingStatusLoading />
        </IndexingStatsShell>
      );

    case StatefulFetchStatusIds.Error:
      return <IndexingStatsShell title={title}>{indexingStatus.reason}</IndexingStatsShell>;

    case StatefulFetchStatusIds.Loaded: {
      const { realtimeProjection } = indexingStatus;
      const omnichainStatusSnapshot = indexingStatus.realtimeProjection.snapshot.omnichainSnapshot;
      let indexingStats: ReactElement;
      let maybeIndexingTimeline: ReactElement | undefined;

      switch (omnichainStatusSnapshot.omnichainStatus) {
        case OmnichainIndexingStatusIds.Unstarted:
          indexingStats = (
            <IndexingStatsForSnapshotUnstarted
              {...buildIndexingStatsProps(realtimeProjection, omnichainStatusSnapshot)}
            />
          );
          break;

        case OmnichainIndexingStatusIds.Backfill:
          indexingStats = (
            <IndexingStatsForSnapshotBackfill
              {...buildIndexingStatsProps(realtimeProjection, omnichainStatusSnapshot)}
            />
          );

          maybeIndexingTimeline = (
            <BackfillStatus
              {...buildIndexingStatsProps(realtimeProjection, omnichainStatusSnapshot)}
            />
          );
          break;

        case OmnichainIndexingStatusIds.Completed:
          indexingStats = (
            <IndexingStatsForSnapshotCompleted
              {...buildIndexingStatsProps(realtimeProjection, omnichainStatusSnapshot)}
            />
          );
          break;

        case OmnichainIndexingStatusIds.Following:
          indexingStats = (
            <IndexingStatsForSnapshotFollowing
              {...buildIndexingStatsProps(realtimeProjection, omnichainStatusSnapshot)}
            />
          );
          break;
      }

      return (
        <section className="flex flex-col gap-6">
          {maybeIndexingTimeline}

          <IndexingStatsShell
            title={title}
            omnichainStatus={omnichainStatusSnapshot.omnichainStatus}
          >
            {indexingStats}
          </IndexingStatsShell>
        </section>
      );
    }
  }
}

export const DisplayIndexingStatusPanelMemo = memo(DisplayIndexingStatusPanel);
