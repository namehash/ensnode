"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BlockInfo } from "@ensnode/ponder-metadata";
import { fromUnixTime, intlFormat } from "date-fns";
import { Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useIndexingStatus } from "./hooks";
import { currentPhase, generateYearMarkers, getTimelinePosition } from "./utils";
import {
  GlobalIndexingStatusViewModel,
  NetworkStatusViewModel,
  ensNodeDepsViewModel,
  ensNodeEnvViewModel,
  globalIndexingStatusViewModel,
} from "./view-models";

export function IndexingStatus() {
  const searchParams = useSearchParams();
  const indexingStatus = useIndexingStatus(searchParams);

  return (
    <section className="flex flex-col gap-6 py-6">
      <NetworkIndexingTimeline indexingStatus={indexingStatus} />

      <NetworkIndexingStats indexingStatus={indexingStatus} />
    </section>
  );
}

interface NetworkIndexingStatsProps {
  indexingStatus: ReturnType<typeof useIndexingStatus>;
}

/**
 * Component to display network indexing stats for each indexed blockchain network.
 * @param props
 * @returns
 */
function NetworkIndexingStats(props: NetworkIndexingStatsProps) {
  const { data, isLoading } = props.indexingStatus;

  if (isLoading) {
    return <NetworkIndexingStatsFallback />;
  }

  if (!data) {
    throw new Error("No data available for network indexing stats");
  }

  const { networkIndexingStatusByChainId } = data.runtime;

  return (
    <div className="px-6">
      <Card className="w-full flex flex-col gap-2">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Indexing Stats</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-8">
          {globalIndexingStatusViewModel(networkIndexingStatusByChainId).networkStatuses.map(
            (networkStatus) => (
              <NetworkIndexingStatsCard key={networkStatus.name} network={networkStatus} />
            ),
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface NetworkIndexingStatsCardProps {
  network: NetworkStatusViewModel;
}

/**
 * Component to display network indexing stats for a single network.
 * @param props
 * @returns
 */
function NetworkIndexingStatsCard(props: NetworkIndexingStatsCardProps) {
  const { network } = props;

  return (
    <Card key={network.name}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{network.name}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <BlockStats label="Last indexed block" block={network.lastIndexedBlock} />
          <BlockStats label="Last synced block" block={network.lastSyncedBlock} />
          <BlockStats label="Latest safe block" block={network.latestSafeBlock} />
        </div>
      </CardContent>
    </Card>
  );
}

interface BlockSatsProps {
  label: string;
  block: BlockInfo | null;
}

/**
 * Component to display requested block stats.
 */
function BlockStats({ label, block }: BlockSatsProps) {
  if (!block) {
    return (
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold">N/A</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{block.number ? `#${block.number}` : "N/A"}</div>
      <div className="text-sm text-muted-foreground">
        {block.timestamp ? intlFormat(fromUnixTime(block.timestamp)) : "N/A"}
      </div>
    </div>
  );
}

interface FallbackViewProps {
  /** Number of placeholders to display. */
  placeholderCount?: number;
}

/**
 * Component to display loading state for network indexing stats.
 */
function NetworkIndexingStatsFallback(props: FallbackViewProps) {
  const { placeholderCount = 3 } = props;

  return (
    <div className="px-6">
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded-md w-48" />
        <div className="space-y-4">
          {Array.from(Array(placeholderCount).keys()).map((i) => (
            <NetworkIndexingStatsPlaceholder key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Component to display a placeholder for the network indexing stats.
 */
function NetworkIndexingStatsPlaceholder() {
  return (
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
  );
}

interface NetworkIndexingTimelineProps {
  indexingStatus: ReturnType<typeof useIndexingStatus>;
}

/**
 * Component to display network indexing timeline for each indexed blockchain network.
 */
function NetworkIndexingTimeline(props: NetworkIndexingTimelineProps) {
  const { indexingStatus } = props;

  if (indexingStatus.isLoading) {
    return <NetworkIndexingTimelineFallback />;
  }

  if (indexingStatus.error) {
    // propagate error to error boundary
    throw indexingStatus.error;
  }

  if (!indexingStatus.data) {
    // this should never happen due to previous assertion
    throw new Error("No data available for network indexing timeline");
  }

  const { data } = indexingStatus;

  return (
    <section className="px-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">ENSIndexer Status</h2>
          <ul className="text-sm text-muted-foreground mt-1 flex gap-4">
            <InlineSummary items={ensNodeDepsViewModel(data.deps)} />
          </ul>

          <ul className="text-sm text-muted-foreground mt-1 flex gap-4">
            <InlineSummary items={ensNodeEnvViewModel(data.env)} />
          </ul>
        </div>
      </header>

      <main className="grid gap-4">
        <IndexingTimeline
          {...globalIndexingStatusViewModel(data.runtime.networkIndexingStatusByChainId)}
        />
      </main>
    </section>
  );
}

interface InlineSummaryProps {
  items: ReadonlyArray<InlineSummaryItemProps>;
}

function InlineSummary(props: InlineSummaryProps) {
  return (
    <ul className="text-sm text-muted-foreground mt-1 flex gap-4">
      {props.items.map((item) => (
        <InlineSummaryItem key={item.label} label={item.label} value={item.value} />
      ))}
    </ul>
  );
}

interface InlineSummaryItemProps {
  label: string;
  value?: string | unknown;
}

function InlineSummaryItem(props: InlineSummaryItemProps) {
  return (
    <li>
      <strong>{props.label}</strong>{" "}
      <pre className="inline-block">{props.value ? props.value.toString() : "unknown"}</pre>
    </li>
  );
}

/**
 * Component to display loading state for the network indexing timeline.
 */
function NetworkIndexingTimelineFallback(props: FallbackViewProps) {
  const { placeholderCount = 3 } = props;

  return (
    <div className="px-6">
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded-md w-48" />
        <div className="space-y-4">
          {Array.from(Array(placeholderCount).keys()).map((i) => (
            <NetworkIndexingTimelinePlaceholder key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Component to display a placeholder for the network indexing timeline.
 */
function NetworkIndexingTimelinePlaceholder() {
  return (
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
  );
}

interface TimelineProps extends GlobalIndexingStatusViewModel {}

export function IndexingTimeline({
  networkStatuses,
  currentIndexingDate,
  indexingStartsAt,
}: TimelineProps) {
  if (!currentIndexingDate) {
    return <IndexingTimelineFallback />;
  }

  // Timeline boundaries
  const timelineStart = indexingStartsAt;
  const timelineEnd = new Date();

  const yearMarkers = generateYearMarkers(timelineStart, timelineEnd);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Indexing Timeline</span>
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-blue-600" />
            <span className="text-sm font-medium">
              Last indexed block on {intlFormat(currentIndexingDate)}
            </span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Timeline header with years */}
        <div className="relative h-6 mb-1 mt-4 ml-24">
          {yearMarkers.map((marker) => (
            <div
              key={`year-${marker.label}`}
              className="absolute -translate-x-1/2"
              style={{ left: `${marker.position}%` }}
            >
              <div className="h-3 w-0.5 bg-gray-400"></div>
              <div className="text-xs text-gray-400">{marker.label}</div>
            </div>
          ))}
        </div>

        {/* Main timeline */}
        <div className="relative mb-4 ml-24">
          {/* Timeline track */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-200"></div>

          <div className="opacity-100 transition-opacity hover:opacity-0">
            {/* Current date indicator */}
            <div
              className="absolute h-full w-0.5 bg-green-800 z-20"
              style={{
                left: `${getTimelinePosition(currentIndexingDate, timelineStart, timelineEnd)}%`,
                top: "0",
                bottom: "0",
                height: `${networkStatuses.length * 60}px`,
              }}
            >
              <div className="absolute -bottom-8 -translate-x-1/2 whitespace-nowrap">
                <Badge className="text-xs bg-green-800 text-white flex flex-col">
                  <span>Processing data</span>{" "}
                  <span>
                    {getTimelinePosition(currentIndexingDate, timelineStart, timelineEnd).toFixed(
                      4,
                    )}
                    %
                  </span>
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Network bars */}
        <div className="space-y-6">
          {networkStatuses.map((networkStatus) => {
            const currentIndexingPhase = currentPhase(currentIndexingDate, networkStatus);

            return (
              <div key={networkStatus.name} className="flex items-center">
                {/* Network label */}
                <div className="w-24 pr-3 text-sm font-medium flex flex-col">
                  <span>{networkStatus.name}</span>
                </div>

                {/* Network timeline bar */}
                <div className="relative flex-1 h-6">
                  {networkStatus.phases.map((phase) => {
                    const isActive = phase.state === currentIndexingPhase.state;
                    const isQueued = phase.state === "queued";
                    const isIndexing = phase.state === "indexing";

                    const startPos = getTimelinePosition(
                      phase.startDate,
                      timelineStart,
                      timelineEnd,
                    );
                    const endPos = phase.endDate
                      ? getTimelinePosition(phase.endDate, timelineStart, timelineEnd)
                      : 100;

                    const width = endPos - startPos;

                    // Skip rendering if width is zero or negative
                    if (width <= 0) return null;

                    return (
                      <div
                        key={`${networkStatus.name}-${phase.state}`}
                        className={cn("absolute h-5 rounded-sm z-10", {
                          "bg-gray-400": isQueued,
                          "bg-blue-500": isIndexing,
                        })}
                        style={{
                          left: `${startPos}%`,
                          width: `${width}%`,
                          opacity: isActive ? 1 : 0.7,
                          boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                          transition: "width 0.3s ease",
                        }}
                      >
                        {width > 10 && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium capitalize">
                            {phase.state}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Network start indicator */}
                  <div
                    className="absolute w-0.5 h-5 bg-gray-800 z-10"
                    style={{
                      left: `${getTimelinePosition(networkStatus.firstBlockToIndex.date, timelineStart, timelineEnd)}%`,
                    }}
                  >
                    <div className="absolute top-4 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-xs text-gray-600">
                        {intlFormat(networkStatus.firstBlockToIndex.date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end mt-8 text-xs gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-gray-400" />
            <span>Queued</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            <span>Indexing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-3 bg-green-800"></div>
            <span>Current</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Component to display loading state for the indexing timeline.
 */
function IndexingTimelineFallback(props: FallbackViewProps) {
  const { placeholderCount = 3 } = props;

  return (
    <div className="p-6">
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded-md w-48" />
        <div className="space-y-4">
          {Array.from(Array(placeholderCount).keys()).map((i) => (
            <IndexingTimelinePlaceholder key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Component to display a placeholder for the indexing timeline.
 */
function IndexingTimelinePlaceholder() {
  return (
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
  );
}
