"use client";

import { FormattedDate, RelativeTime } from "@/components/datetime-utils";
import { ENSIndexerIcon } from "@/components/ensindexer-icon";
import { useENSIndexerConfig, useIndexingStatus } from "@/components/ensindexer/hooks";
import { ENSNodeIcon } from "@/components/ensnode-icon";
import { ENSRainbowIcon } from "@/components/ensrainbow-icon";
import {
  currentPhase,
  generateYearMarkers,
  getTimelinePosition,
} from "@/components/indexing-status/utils";
import {
  BlockInfoViewModel,
  ChainIndexingPhaseViewModel,
  blockViewModel,
} from "@/components/indexing-status/view-models";
import { ChainIcon } from "@/components/ui/ChainIcon";
import { ChainName } from "@/components/ui/ChainName";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBlockExplorerUrlForBlock, getChainName } from "@/lib/namespace-utils";
import { cn } from "@/lib/utils";
import {
  ChainId,
  ChainIndexingBackfillStatus,
  ChainIndexingStatusIds,
  ChainIndexingStrategyIds,
  ENSIndexerOverallIndexingBackfillStatus,
  ENSIndexerOverallIndexingCompletedStatus,
  ENSIndexerOverallIndexingErrorStatus,
  ENSIndexerOverallIndexingFollowingStatus,
  ENSIndexerOverallIndexingStatus,
  ENSIndexerOverallIndexingUnstartedStatus,
  ENSIndexerPublicConfig,
  OverallIndexingStatusIds,
} from "@ensnode/ensnode-sdk";
import { fromUnixTime, intlFormat } from "date-fns";
import { Clock, ExternalLink } from "lucide-react";
import type { ReactElement } from "react";

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
  value?: ReactElement | unknown;
}

function InlineSummaryItem(props: InlineSummaryItemProps) {
  return (
    <li>
      <strong>{props.label}</strong>{" "}
      <pre className="inline-block">{props.value ? props.value.toString() : "unknown"}</pre>
    </li>
  );
}

interface ENSIndexerDependencyInfoProps {
  ensIndexerConfig: ENSIndexerPublicConfig;
}

function ENSIndexerDependencyInfo({ ensIndexerConfig }: ENSIndexerDependencyInfoProps) {
  const { dependencyInfo, plugins, namespace, databaseSchemaName } = ensIndexerConfig;

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
          <div className="text-sm text-muted-foreground marker:mb-4">
            <InlineSummary
              items={[{ label: "Connection", value: ensIndexerConfig.ensNodePublicUrl.href }]}
            />
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
                      <InlineSummary
                        items={[
                          { label: "Node.js", value: dependencyInfo.nodejs },
                          { label: "Ponder", value: dependencyInfo.ponder },
                        ]}
                      />
                    </ul>
                  </div>

                  <div>
                    <ul className="text-sm text-muted-foreground flex gap-4">
                      <InlineSummary
                        items={[
                          { label: "ENS Namespace", value: namespace },
                          { label: "Activated Plugins", value: plugins },
                          { label: "Database Schema Name", value: databaseSchemaName },
                        ]}
                      />
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <InlineSummary
                      items={[
                        { label: "Version", value: dependencyInfo.ensRainbow },
                        { label: "Schema Version", value: dependencyInfo.ensRainbowSchema },
                      ]}
                    />
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

interface ChainIndexingStatusProps {
  currentIndexingDate: Date | null;
  timelineStart: Date;
  timelineEnd: Date;
  chainStatus: {
    chainId: ChainId;
    chainName: string;
    firstBlockToIndex: BlockInfoViewModel;
    lastIndexedBlock: BlockInfoViewModel | null;
    phases: Array<ChainIndexingPhaseViewModel>;
  };
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

interface IndexingTimelineProps {
  indexingStatus: ENSIndexerOverallIndexingBackfillStatus;
}

function IndexingTimeline({ indexingStatus }: IndexingTimelineProps) {
  // Timeline boundaries
  const chains = Array.from(indexingStatus.chains.entries());
  const timelineStartUnixTimestamp = Math.min(
    ...chains.map(([, chain]) => chain.config.startBlock.timestamp),
  );

  const backfillChains = chains.filter(
    ([, chain]) => chain.status === ChainIndexingStatusIds.Backfill,
  ) as Array<[ChainId, ChainIndexingBackfillStatus]>;

  const timelineEndUnixTimestamp = Math.max(
    ...backfillChains.map(([, chain]) => chain.backfillEndBlock.timestamp),
  );
  console.log({ timelineEndUnixTimestamp });
  const currentIndexingDate = fromUnixTime(indexingStatus.omnichainIndexingCursor);

  const timelineStart = fromUnixTime(timelineStartUnixTimestamp);
  const timelineEnd = fromUnixTime(timelineEndUnixTimestamp);

  const yearMarkers = generateYearMarkers(timelineStart, timelineEnd);
  const timelinePositionValue = currentIndexingDate
    ? getTimelinePosition(currentIndexingDate, timelineStart, timelineEnd)
    : 0;

  const timelinePosition =
    timelinePositionValue > 0 && timelinePositionValue < 100
      ? timelinePositionValue.toFixed(4)
      : timelinePositionValue;

  return (
    <main className="grid gap-4">
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <span>
              Indexing Status:{" "}
              <Badge className="bg-green-700 uppercase">{indexingStatus.overallStatus}</Badge>
            </span>

            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-blue-600" />
              <span className="text-sm font-medium">
                Last indexed block on{" "}
                <FormattedDate
                  date={fromUnixTime(indexingStatus.omnichainIndexingCursor)}
                  options={{
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }}
                />
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
                  height: `${chains.length * 60}px`,
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
            {chains.map(([chainId, chain], idx) => {
              const phases: ChainIndexingPhaseViewModel[] = [];

              if (timelineStartUnixTimestamp < chain.config.startBlock.timestamp) {
                phases.push({
                  startDate: timelineStart,
                  endDate: fromUnixTime(chain.config.startBlock.timestamp - 1),
                  state: "queued",
                });
              }

              phases.push({
                startDate: fromUnixTime(chain.config.startBlock.timestamp),
                endDate: timelineEnd,
                state: "indexing",
              });

              const firstBlockToIndex = blockViewModel(chain.config.startBlock);
              let lastIndexedBlock: BlockInfoViewModel | null = null;
              let latestSafeBlock: BlockInfoViewModel;

              if (chain.status === ChainIndexingStatusIds.Backfill) {
                lastIndexedBlock = blockViewModel(chain.latestIndexedBlock);
                latestSafeBlock = blockViewModel(chain.backfillEndBlock);
              }

              return (
                <ChainIndexingStatus
                  key={idx}
                  currentIndexingDate={currentIndexingDate}
                  chainStatus={{
                    chainId,
                    chainName: getChainName(chainId),
                    firstBlockToIndex,
                    lastIndexedBlock,
                    phases,
                  }}
                  timelineStart={timelineStart}
                  timelineEnd={timelineEnd}
                />
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
    </main>
  );
}

interface BlockNumberProps {
  chainId: number;
  block: BlockInfoViewModel;
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

interface BlockStatsProps {
  chainId: number;
  label: string;
  block: BlockInfoViewModel | null;
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
          date={block.date}
          enforcePast={true}
          conciseFormatting={true}
          includeSeconds={true}
        />
      </div>
    </div>
  );
}

interface IndexingStatusProps<IndexingStatusType extends ENSIndexerOverallIndexingStatus> {
  indexingStatus: IndexingStatusType;
}

function UnstartedIndexingStatus({
  indexingStatus,
}: IndexingStatusProps<ENSIndexerOverallIndexingUnstartedStatus>) {
  return (
    <>
      <h1>Unstarted</h1>
    </>
  );
}

function IndexingStats({
  indexingStatus,
}: { indexingStatus: ENSIndexerOverallIndexingBackfillStatus }) {
  return (
    <Card className="w-full flex flex-col gap-2">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Indexed Chains</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        {indexingStatus.chains.entries().map(([chainId, chain]) => (
          <Card key={`Chain#${chainId}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex flex-row justify-start items-center gap-2">
                    <ChainName chainId={chainId} className="font-semibold text-left"></ChainName>
                    <ChainIcon chainId={chainId} />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                <BlockStats
                  chainId={chainId}
                  label="Start block"
                  block={blockViewModel(chain.config.startBlock)}
                />

                {chain.config.strategy === ChainIndexingStrategyIds.Definite && (
                  <BlockStats
                    chainId={chainId}
                    label="End block"
                    block={blockViewModel(chain.config.endBlock)}
                  />
                )}
                {chain.status === ChainIndexingStatusIds.Backfill && (
                  <>
                    <BlockStats
                      chainId={chainId}
                      label="Latest indexed block"
                      block={blockViewModel(chain.latestIndexedBlock)}
                    />

                    <BlockStats
                      chainId={chainId}
                      label="Latest known block"
                      block={blockViewModel(chain.backfillEndBlock)}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}

function BackfillIndexingStatus({
  indexingStatus,
}: IndexingStatusProps<ENSIndexerOverallIndexingBackfillStatus>) {
  return (
    <section className="px-6 grid gap-4 mb-8">
      <IndexingTimeline indexingStatus={indexingStatus} />

      <IndexingStats indexingStatus={indexingStatus} />
    </section>
  );
}

function CompletedIndexingStatus({
  indexingStatus,
}: IndexingStatusProps<ENSIndexerOverallIndexingCompletedStatus>) {
  return (
    <>
      <h1>Completed</h1>
    </>
  );
}

function FollowingIndexingStatus({
  indexingStatus,
}: IndexingStatusProps<ENSIndexerOverallIndexingFollowingStatus>) {
  return (
    <>
      <h1>Following</h1>
    </>
  );
}

function IndexerErrorIndexingStatus({
  indexingStatus,
}: IndexingStatusProps<ENSIndexerOverallIndexingErrorStatus>) {
  return (
    <>
      <h1>Indexer Error</h1>
    </>
  );
}

export function IndexingStatus() {
  const ensIndexerConfigQuery = useENSIndexerConfig();
  const indexingStatusQuery = useIndexingStatus();

  if (ensIndexerConfigQuery.isError) {
    return <p>Failed to fetch ENSIndexer Config.</p>;
  }
  if (indexingStatusQuery.isError) {
    return <p>Failed to fetch Indexing Status.</p>;
  }

  if (!ensIndexerConfigQuery.isSuccess || !indexingStatusQuery.isSuccess) {
    return <p>Waiting for ENSIndexer data to resolve</p>;
  }

  const ensIndexerConfig = ensIndexerConfigQuery.data;
  const indexingStatus = indexingStatusQuery.data;

  let concreteIndexingStatus: ReactElement;

  switch (indexingStatus.overallStatus) {
    case OverallIndexingStatusIds.Unstarted:
      concreteIndexingStatus = <UnstartedIndexingStatus indexingStatus={indexingStatus} />;
      break;

    case OverallIndexingStatusIds.Backfill:
      concreteIndexingStatus = <BackfillIndexingStatus indexingStatus={indexingStatus} />;
      break;

    case OverallIndexingStatusIds.Completed:
      concreteIndexingStatus = <CompletedIndexingStatus indexingStatus={indexingStatus} />;
      break;

    case OverallIndexingStatusIds.Following:
      concreteIndexingStatus = <FollowingIndexingStatus indexingStatus={indexingStatus} />;
      break;

    case OverallIndexingStatusIds.IndexerError:
      concreteIndexingStatus = <IndexerErrorIndexingStatus indexingStatus={indexingStatus} />;
  }

  return (
    <section className="flex flex-col gap-6 py-6">
      <ENSIndexerDependencyInfo ensIndexerConfig={ensIndexerConfig} />

      {concreteIndexingStatus}
    </section>
  );
}
