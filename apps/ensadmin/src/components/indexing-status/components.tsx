"use client";

import { RelativeTime, unixTimestampToDate } from "@/components/datetime-utils";
import { ENSIndexerIcon } from "@/components/ensindexer-icon";
import { useIndexingStatusQuery } from "@/components/ensnode";
import { ENSNodeIcon } from "@/components/ensnode-icon";
import { ENSRainbowIcon } from "@/components/ensrainbow-icon";
import { ChainIcon } from "@/components/ui/ChainIcon";
import { ChainName } from "@/components/ui/ChainName";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { selectedEnsNodeUrl } from "@/lib/env";
import { cn } from "@/lib/utils";
import { getBlockExplorerUrlForBlock } from "@ensnode/datasources";
import type { BlockInfo } from "@ensnode/ponder-metadata";
import { intlFormat } from "date-fns";
import { Clock, ExternalLink } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { currentPhase, generateYearMarkers, getTimelinePosition } from "./utils";
import {
  ChainIndexingPhaseViewModel,
  ChainStatusViewModel,
  GlobalIndexingStatusViewModel,
  ensNodeDepsViewModel,
  ensNodeEnvViewModel,
  ensRainbowViewModel,
  globalIndexingStatusViewModel,
} from "./view-models";

export function IndexingStatus() {
  const searchParams = useSearchParams();
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);
  const indexingStatus = useIndexingStatusQuery(ensNodeUrl);

  return (
    <section className="flex flex-col gap-6 py-6">
      <ChainIndexingTimeline indexingStatus={indexingStatus} />

      <ChainIndexingStats indexingStatus={indexingStatus} />
    </section>
  );
}

interface ChainIndexingStatsProps {
  indexingStatus: ReturnType<typeof useIndexingStatusQuery>;
}

/**
 * Component to display chain indexing stats for each indexed blockchain chain.
 * @param props
 * @returns
 */
function ChainIndexingStats(props: ChainIndexingStatsProps) {
  const { data, isLoading } = props.indexingStatus;

  if (isLoading) {
    return <ChainIndexingStatsFallback />;
  }

  if (!data) {
    // propagate error to error boundary
    throw new Error("No data available for chain indexing stats");
  }

  const { chainIndexingStatuses } = data.runtime;
  const namespace = data.env.NAMESPACE;

  return (
    <div className="px-6">
      <Card className="w-full flex flex-col gap-2">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Indexed Chains</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-row flex-wrap gap-8">
          {globalIndexingStatusViewModel(chainIndexingStatuses, namespace).chainStatuses.map(
            (chainStatus) => (
              <ChainIndexingStatsCard key={chainStatus.chainId} chainStatus={chainStatus} />
            ),
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ChainIndexingStatsCardProps {
  chainStatus: ChainStatusViewModel;
}

/**
 * Component to display indexing stats for a single chain.
 * @param ChainIdexingStatsCardProps
 * @returns
 */
function ChainIndexingStatsCard({ chainStatus }: ChainIndexingStatsCardProps) {
  return (
    <Card key={`Chain#${chainStatus.chainId}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex flex-row justify-start items-center gap-2">
              <ChainName
                chainId={chainStatus.chainId}
                className="font-semibold text-left"
              ></ChainName>
              <ChainIcon chainId={chainStatus.chainId} />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-8">
          <BlockStats
            chainId={chainStatus.chainId}
            label="Last indexed block"
            block={chainStatus.lastIndexedBlock}
          />
          <BlockStats
            chainId={chainStatus.chainId}
            label="Latest safe block"
            block={chainStatus.latestSafeBlock}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface BlockStatsProps {
  chainId: number;
  label: string;
  block: BlockInfo | null;
}

/**
 * Component to display requested block stats.
 */
function BlockStats({ chainId, label, block }: BlockStatsProps) {
  // return a fallback for undefined block
  if (!block) {
    return (
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold">N/A</div>
      </div>
    );
  }

  // if the block is defined, return its details
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <BlockNumber block={block} chainId={chainId} />
      <div className="text-xs text-muted-foreground">
        <RelativeTime
          date={unixTimestampToDate(block.timestamp.toString())}
          enforcePast={true}
          conciseFormatting={true}
          includeSeconds={true}
        />
      </div>
    </div>
  );
}

interface BlockNumberProps {
  chainId: number;
  block: BlockInfo;
}

/**
 * Displays the block number for a BlockInfo.
 *
 * Optionally provides a link to the block details page on the chain's designated block explorer page.
 * If the chain has no known block explorer, just displays the block number (without link).
 **/
function BlockNumber({ chainId, block }: BlockNumberProps) {
  const blockExplorerUrl = getBlockExplorerUrlForBlock(chainId, block.number);
  if (blockExplorerUrl) {
    return (
      <a
        href={blockExplorerUrl.toString()}
        target="_blank"
        rel="noreferrer noopener"
        className="w-fit text-lg font-semibold flex items-center gap-1 text-blue-600 hover:underline cursor-pointer"
      >
        #{block.number}
        <ExternalLink size={16} className="inline-block flex-shrink-0" />
      </a>
    );
  }

  return <div className="text-lg font-semibold">#${block.number}</div>;
}

interface LoadingViewProps {
  /** Number of placeholders to display. */
  placeholderCount?: number;
}

/**
 * Component to display loading state for chain indexing stats.
 */
function ChainIndexingStatsFallback(props: LoadingViewProps) {
  const { placeholderCount = 3 } = props;

  return (
    <div className="px-6">
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded-md w-48" />
        <div className="space-y-4">
          {Array.from(Array(placeholderCount).keys()).map((i) => (
            <ChainIndexingStatsPlaceholder key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Component to display a placeholder for the chain indexing stats.
 */
function ChainIndexingStatsPlaceholder() {
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

interface ChainIndexingTimelineProps {
  /** ENSNode status query result */
  indexingStatus: ReturnType<typeof useIndexingStatusQuery>;
}

/**
 * Component to display chain indexing timeline for each indexed blockchain chain.
 */
function ChainIndexingTimeline(props: ChainIndexingTimelineProps) {
  const { indexingStatus } = props;
  const searchParams = useSearchParams();
  const currentEnsNodeUrl = selectedEnsNodeUrl(searchParams);

  if (indexingStatus.isLoading) {
    return <ChainIndexingTimelineFallback />;
  }

  if (indexingStatus.error) {
    // propagate error to error boundary
    throw indexingStatus.error;
  }

  if (!indexingStatus.data) {
    // propagate error to error boundary
    throw new Error("No data available for chain indexing timeline");
  }

  const { data } = indexingStatus;
  const ensRainbowVersion = ensRainbowViewModel(data.runtime);

  return (
    <section className="px-6">
      <Card className="w-full mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ENSNodeIcon width={28} height={28} />
            <span>ENSNode</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground pl-9 mb-4">
            <span className="font-semibold">Connection:</span> {currentEnsNodeUrl.toString()}
          </div>

          <div className="space-y-6">
            {/* ENSIndexer Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ENSIndexerIcon width={24} height={24} />
                  <span>ENSIndexer</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 pl-8">
                  <div>
                    <ul className="text-sm text-muted-foreground flex gap-4">
                      <InlineSummary items={ensNodeDepsViewModel(data.deps)} />
                    </ul>
                  </div>

                  <div>
                    <ul className="text-sm text-muted-foreground flex gap-4">
                      <InlineSummary items={ensNodeEnvViewModel(data.env)} />
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ENSRainbow Section - only show if available */}
            {ensRainbowVersion && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ENSRainbowIcon width={24} height={24} />
                    <span>ENSRainbow</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="pl-8">
                    <ul className="text-sm text-muted-foreground flex gap-4">
                      <InlineSummary items={ensRainbowVersion} />
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      <main className="grid gap-4">
        <IndexingTimeline
          {...globalIndexingStatusViewModel(data.runtime.chainIndexingStatuses, data.env.NAMESPACE)}
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
 * Component to display loading state for the chain indexing timeline.
 */
function ChainIndexingTimelineFallback(props: LoadingViewProps) {
  const { placeholderCount = 3 } = props;

  return (
    <div className="px-6">
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded-md w-48" />
        <div className="space-y-4">
          {Array.from(Array(placeholderCount).keys()).map((i) => (
            <ChainIndexingTimelinePlaceholder key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Component to display a placeholder for the chain indexing timeline.
 */
function ChainIndexingTimelinePlaceholder() {
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
  chainStatuses,
  currentIndexingDate,
  indexingStartsAt,
}: TimelineProps) {
  // Timeline boundaries
  const timelineStart = indexingStartsAt;
  const timelineEnd = new Date();

  const yearMarkers = generateYearMarkers(timelineStart, timelineEnd);
  const timelinePositionValue = currentIndexingDate
    ? getTimelinePosition(currentIndexingDate, timelineStart, timelineEnd)
    : 0;

  const timelinePosition =
    timelinePositionValue > 0 && timelinePositionValue < 100
      ? timelinePositionValue.toFixed(4)
      : timelinePositionValue;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Indexing Status</span>
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-blue-600" />
            <span className="text-sm font-medium">
              Last indexed block on{" "}
              {currentIndexingDate ? intlFormat(currentIndexingDate) : "pending"}
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
                left: `${timelinePosition}%`,
                top: "0",
                bottom: "0",
                height: `${chainStatuses.length * 60}px`,
              }}
            >
              <div className="absolute -bottom-8 -translate-x-1/2 whitespace-nowrap">
                <Badge className="text-xs bg-green-800 text-white flex flex-col">
                  <span>Processing data</span> <span>{timelinePosition}%</span>
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Chain indexing status: progress bars */}
        <div className="space-y-6">
          {chainStatuses.map((chainStatus) => (
            <ChainIndexingStatus
              key={chainStatus.chainId}
              currentIndexingDate={currentIndexingDate}
              chainStatus={chainStatus}
              timelineStart={timelineStart}
              timelineEnd={timelineEnd}
            />
          ))}
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

interface ChainIndexingStatusProps {
  currentIndexingDate: Date | null;
  timelineStart: Date;
  timelineEnd: Date;
  chainStatus: ChainStatusViewModel;
}

/**
 * Component to display chain indexing status for a single chain.
 * Includes a timeline bar for each indexing phase.
 */
function ChainIndexingStatus(props: ChainIndexingStatusProps) {
  const { currentIndexingDate, chainStatus, timelineStart, timelineEnd } = props;
  const currentIndexingPhase = currentPhase(currentIndexingDate, chainStatus);

  return (
    <div key={chainStatus.chainId} className="flex items-center">
      {/* ChainName label */}
      <div className="w-24 pr-3 flex flex-col">
        <ChainName chainId={chainStatus.chainId} className="text-sm font-medium"></ChainName>
      </div>

      {/* Chain timeline bar */}
      <div className="relative flex-1 h-6">
        {chainStatus.phases.map((phase) => (
          <ChainIndexingPhase
            key={`${chainStatus.chainId}-${phase.state}`}
            phase={phase}
            isActive={phase === currentIndexingPhase}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
          />
        ))}

        {/* Chain start indicator */}
        <div
          className="absolute w-0.5 h-5 bg-gray-800 z-10"
          style={{
            left: `${getTimelinePosition(
              chainStatus.firstBlockToIndex.date,
              timelineStart,
              timelineEnd,
            )}%`,
          }}
        >
          <div className="absolute top-4 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs text-gray-600">
              {intlFormat(chainStatus.firstBlockToIndex.date)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ChainIndexingPhaseProps {
  phase: ChainIndexingPhaseViewModel;
  isActive: boolean;
  timelineStart: Date;
  timelineEnd: Date;
}

/**
 * Component to display a single indexing phase on the chain indexing timeline.
 */
function ChainIndexingPhase({
  phase,
  isActive,
  timelineStart,
  timelineEnd,
}: ChainIndexingPhaseProps) {
  const isQueued = phase.state === "queued";
  const isIndexing = phase.state === "indexing";

  const startPos = getTimelinePosition(phase.startDate, timelineStart, timelineEnd);
  const endPos = phase.endDate
    ? getTimelinePosition(phase.endDate, timelineStart, timelineEnd)
    : 100;

  const width = endPos - startPos;

  // Skip rendering if width is zero or negative
  if (width <= 0) return null;

  return (
    <div
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
}

/**
 * Component to display loading state for the indexing timeline.
 */
function IndexingTimelineLoading(props: LoadingViewProps) {
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
