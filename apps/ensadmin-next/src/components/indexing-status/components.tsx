"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getChainName } from "@/lib/chains";
import { cn } from "@/lib/utils";
import { cx } from "class-variance-authority";
import { Clock, Info, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { NetworkIndexingStatus, useIndexingStatus } from "./hooks";

// Format date for display
const formatDate = (date: Date) => {
  return date.toLocaleDateString(navigator.language, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function IndexingStatus() {
  const searchParams = useSearchParams();
  const indexingStatus = useIndexingStatus(searchParams);

  if (indexingStatus.error) {
    return (
      <div className="px-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <Info className="h-5 w-5" />
                <p>
                  Error:{" "}
                  {indexingStatus.error instanceof Error
                    ? indexingStatus.error.message
                    : "Failed to fetch status"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => indexingStatus.refetch()}
                disabled={indexingStatus.isRefetching}
                className="ml-4"
              >
                <RefreshCw
                  className={cn("h-4 w-4 mr-2", indexingStatus.isRefetching && "animate-spin")}
                />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6 py-6">
      <NetworkIndexingTimeline {...indexingStatus} />
      <NetworkIndexingStats {...indexingStatus} />
    </section>
  );
}

type NetworkIndexingStatsProps = ReturnType<typeof useIndexingStatus>;

function NetworkIndexingStats(props: NetworkIndexingStatsProps) {
  const { data, isLoading } = props;

  if (isLoading) {
    return (
      <div className="px-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded-md w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
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
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.runtime.networkIndexingStatus) {
    return (
      <div className="px-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-700">
                <Info className="h-5 w-5" />
                <p>No status data available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { networks } = mapNetworksData(data.runtime.networkIndexingStatus);

  return (
    <div className="px-6">
      <Card className="w-full flex flex-col gap-2">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Indexing Stats</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-8">
          {networks.map((network) => (
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
                  <div>
                    <div className="text-sm text-muted-foreground">Last indexed block</div>
                    <div className="text-lg font-semibold">
                      {network.lastIndexedBlock?.height
                        ? `#${network.lastIndexedBlock?.height}`
                        : "N/A"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {network.lastIndexedBlockDate
                        ? formatDate(network.lastIndexedBlockDate)
                        : "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Last synced block</div>
                    <div className="text-lg font-semibold">#{network.lastSyncedBlock.height}</div>
                    <div className="text-sm text-muted-foreground">
                      {network.lastSyncedBlockDate
                        ? formatDate(network.lastSyncedBlockDate)
                        : "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Latest safe block</div>
                    <div className="text-lg font-semibold">#{network.latestSafeBlock.height}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(network.latestSafeBlockDate)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

type NetworkIndexingTimelineProps = ReturnType<typeof useIndexingStatus>;

function NetworkIndexingTimeline(props: NetworkIndexingTimelineProps) {
  const { data, isLoading } = props;

  if (isLoading) {
    return (
      <div className="px-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded-md w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
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
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.runtime.networkIndexingStatus) {
    return (
      <div className="px-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-700">
                <Info className="h-5 w-5" />
                <p>No status data available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { networks, currentIndexingDate } = mapNetworksData(data.runtime.networkIndexingStatus);

  return (
    <section className="px-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">ENSIndexer Status</h2>
          <ul className="text-sm text-muted-foreground mt-1 flex gap-4">
            {[
              ["ENSNode", `v${data.app.version}`],
              ["Ponder", `v${data.deps.ponder}`],
              ["Node.js", data.deps.nodejs],
            ].map(([label, value]) => (
              <li key={label}>
                <strong>{label}</strong> <pre className="inline-block">{value}</pre>
              </li>
            ))}
          </ul>

          <ul className="text-sm text-muted-foreground mt-1 flex gap-4">
            {[
              ["Active plugins", data.env.ACTIVE_PLUGINS],
              ["ENS Deployment Chain", data.env.ENS_DEPLOYMENT_CHAIN],
              ["Index database schema", data.env.DATABASE_SCHEMA],
            ].map(([label, value]) => (
              <li key={label}>
                <strong>{label}</strong> <pre className="inline-block">{value}</pre>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <main className="grid gap-4">
        <IndexingTimeline networks={networks} currentIndexingDate={currentIndexingDate} />
      </main>
    </section>
  );
}

function mapNetworksData(networkIndexingStatus: Record<string, NetworkIndexingStatus>) {
  const firstBlockToIndexGlobally = Object.values(networkIndexingStatus).reduce(
    (acc, status) => {
      if (!acc) return status.firstBlockToIndex;
      if (!status.firstBlockToIndex) return acc;
      if (status.firstBlockToIndex.timestamp < acc.timestamp) return status.firstBlockToIndex;
      return acc;
    },
    null as null | { height: number; timestamp: number; utc: string },
  );

  if (!firstBlockToIndexGlobally) {
    throw new Error("No first block to index globally");
  }

  const firstBlockToIndexGloballyDate = new Date(firstBlockToIndexGlobally.timestamp * 1000);

  // Convert network status data to timeline format
  const networks = Object.entries(networkIndexingStatus).map(([chainId, networkStatus]) => {
    if (!networkStatus.firstBlockToIndex) {
      throw new Error(`No first block to index for chain ${chainId}`);
    }

    const chainIdNum = parseInt(chainId);
    const phases = [];

    const networkIndexingStartsAtDate = new Date(networkStatus.firstBlockToIndex.timestamp * 1000);
    const lastSyncedBlockDate = networkStatus.lastSyncedBlock
      ? new Date(networkStatus.lastSyncedBlock.timestamp * 1000)
      : null;
    const lastIndexedBlockDate = networkStatus.lastIndexedBlock
      ? new Date(networkStatus.lastIndexedBlock.timestamp * 1000)
      : null;
    const latestSafeBlockDate = new Date(networkStatus.latestSafeBlock.timestamp * 1000);

    if (networkIndexingStartsAtDate > firstBlockToIndexGloballyDate) {
      phases.push({
        state: "queued" as const,
        startDate: firstBlockToIndexGloballyDate,
        endDate: networkIndexingStartsAtDate,
        color: "#fbbf24",
      });
    }

    phases.push({
      state: "indexing" as const,
      startDate: networkIndexingStartsAtDate,
      endDate: latestSafeBlockDate,
      color: "#3b82f6",
    });

    const result = {
      name: getChainName(chainIdNum),
      startDate: phases.toReversed()[0].startDate,
      lastIndexedBlockDate,
      lastIndexedBlock: networkStatus.lastIndexedBlock,
      lastSyncedBlockDate,
      lastSyncedBlock: networkStatus.lastSyncedBlock,
      latestSafeBlockDate,
      latestSafeBlock: networkStatus.latestSafeBlock,
      phases,
    };

    return result;
  });

  const currentIndexingDate = networks[0].lastIndexedBlockDate;

  return { networks, currentIndexingDate };
}

interface Network {
  name: string;
  startDate: Date;
  lastIndexedBlockDate: Date | null;
  lastIndexedBlock: {
    height: number;
    timestamp: number;
    utc: string;
  } | null;
  lastSyncedBlockDate: Date | null;
  lastSyncedBlock: {
    height: number;
    timestamp: number;
    utc: string;
  } | null;
  latestSafeBlockDate: Date;
  latestSafeBlock: {
    height: number;
    timestamp: number;
    utc: string;
  };
  phases: Array<{
    state: "queued" | "indexing";
    startDate: Date;
    endDate: Date | null;
    color: string;
  }>;
}

interface TimelineProps {
  networks: Array<Network>;
  currentIndexingDate: Date | null;
}

export function IndexingTimeline({ networks, currentIndexingDate }: TimelineProps) {
  if (!currentIndexingDate) {
    return <LoadingState />;
  }

  // Timeline boundaries
  const timelineStart = networks.reduce((acc, network) => {
    return network.startDate < acc ? network.startDate : acc;
  }, networks[0].startDate);
  const timelineEnd = new Date();

  const progress =
    ((currentIndexingDate.getTime() - timelineStart.getTime()) /
      (timelineEnd.getTime() - timelineStart.getTime())) *
    100;

  // Calculate position on timeline as percentage
  const getTimelinePosition = (date: Date) => {
    const start = timelineStart.getTime();
    const end = timelineEnd.getTime();
    const point = date.getTime();

    const percentage = ((point - start) / (end - start)) * 100;

    return Math.max(0, Math.min(100, percentage));
  };

  // Get current phase for a network
  const getCurrentPhase = (network: Network) => {
    for (let i = network.phases.length - 1; i >= 0; i--) {
      if (currentIndexingDate >= network.phases[i].startDate) {
        return network.phases[i];
      }
    }
    return network.phases[0];
  };

  // Generate year markers for the timeline
  const generateYearMarkers = () => {
    const markers = [];
    const startYear = timelineStart.getFullYear();
    const endYear = timelineEnd.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      const date = new Date(year, 0, 1);
      if (date >= timelineStart && date <= timelineEnd) {
        markers.push({
          date,
          position: getTimelinePosition(date),
          label: year.toString(),
        });
      }
    }

    return markers;
  };

  const yearMarkers = generateYearMarkers();

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Indexing Timeline</span>
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-blue-600" />
            <span className="text-sm font-medium">
              Last indexed block on {formatDate(currentIndexingDate)}
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
              <div className="h-3 w-0.5 bg-gray-300"></div>
              <div className="text-xs text-gray-500">{marker.label}</div>
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
                left: `${getTimelinePosition(currentIndexingDate)}%`,
                top: "0",
                bottom: "0",
                height: `${networks.length * 60}px`,
              }}
            >
              <div className="absolute -bottom-8 -translate-x-1/2 whitespace-nowrap">
                <Badge className="text-xs bg-green-800 text-white flex flex-col">
                  <span>Processing data</span> <span>{progress.toFixed(4)}%</span>
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Network bars */}
        <div className="space-y-6">
          {networks.map((network) => {
            const currentPhase = getCurrentPhase(network);

            return (
              <div key={network.name} className="flex items-center">
                {/* Network label */}
                <div className="w-24 pr-3 text-sm font-medium flex flex-col">
                  <span>{network.name}</span>
                </div>

                {/* Network timeline bar */}
                <div className="relative flex-1 h-6">
                  {network.phases.map((phase) => {
                    const isActive = phase.state === currentPhase.state;

                    const startPos = getTimelinePosition(phase.startDate);
                    const endPos = phase.endDate ? getTimelinePosition(phase.endDate) : 100;

                    const width = endPos - startPos;

                    // Skip rendering if width is zero or negative
                    if (width <= 0) return null;

                    return (
                      <div
                        key={`${network.name}-${phase.state}`}
                        className={cx("absolute h-5 rounded-sm z-10")}
                        style={{
                          left: `${startPos}%`,
                          width: `${width}%`,
                          backgroundColor: phase.color,
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
                    style={{ left: `${getTimelinePosition(network.startDate)}%` }}
                  >
                    <div className="absolute top-4 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-xs text-gray-600">{formatDate(network.startDate)}</span>
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
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#fbbf24" }}></div>
            <span>Queued</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#3b82f6" }}></div>
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

function LoadingState() {
  return (
    <div className="p-6">
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded-md w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
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
          ))}
        </div>
      </div>
    </div>
  );
}
