'use client';

import {
  Info,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getChainName } from '@/lib/chains';
import { useIndexingStatus } from './hooks';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export function IndexingStatus() {
  const searchParams = useSearchParams();
  const { data, error, isLoading, isRefetching, refetch } = useIndexingStatus(searchParams);

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <Info className="h-5 w-5" />
                <p>
                  Error:{' '}
                  {error instanceof Error
                    ? error.message
                    : 'Failed to fetch status'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="ml-4"
              >
                <RefreshCw
                  className={cn('h-4 w-4 mr-2', isRefetching && 'animate-spin')}
                />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
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

  if (!data || !data.runtime.networkIndexingStatus) {
    return (
      <div className="p-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-700">
                <Info className="h-5 w-5" />
                <p>No status data available</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="ml-4"
              >
                <RefreshCw
                  className={cn('h-4 w-4 mr-2', isRefetching && 'animate-spin')}
                />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Convert network status data to timeline format
  const networks = Object.entries(data.runtime.networkIndexingStatus).map(([chainId, status]) => {
    const chainIdNum = parseInt(chainId);
    const phases = [];

    // Use the provided timestamp for Ethereum's start date
    const startDate = chainIdNum === 1
      ? new Date(1740429683 * 1000) // Convert Unix timestamp to milliseconds
      : new Date(status.lastIndexedBlock?.utc || status.latestSafeBlock.utc);

    if (status.isQueued) {
      phases.push({
        state: 'queued' as const,
        startDate,
        color: '#fbbf24'
      });
    } else {
      phases.push({
        state: 'indexing' as const,
        startDate,
        color: '#3b82f6'
      });
    }

    return {
      name: getChainName(chainIdNum),
      startDate,
      phases
    };
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Indexer Control Panel</h2>
          <p className="text-sm text-muted-foreground mt-1">
            ENSNode {data.version} • Ponder {data.deps.ponder} • Node.js{' '}
            {data.deps.nodejs}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="hover:border-primary/50"
        >
          <RefreshCw
            className={cn('h-4 w-4 mr-2', isRefetching && 'animate-spin')}
          />
          Refresh Status
        </Button>
      </div>

      <div className="grid gap-4">
        <IndexingTimeline
          networks={networks}
          currentDate={new Date()}
        />
      </div>
    </div>
  );
}


interface Network {
  name: string;
  startDate: Date;
  phases: Array<{
    state: 'queued' | 'indexing';
    startDate: Date;
    color: string;
  }>;
}

interface TimelineProps {
  networks?: Network[];
  currentDate?: Date;
}

export function IndexingTimeline({ networks: initialNetworks, currentDate: initialDate }: TimelineProps) {
  // Sample networks data if none provided
  const networks = initialNetworks || [
    {
      name: 'Ethereum',
      startDate: new Date('2017-03-29'),
      phases: [
        { state: 'indexing', startDate: new Date('2017-03-29'), color: '#3b82f6' }
      ]
    },
    {
      name: 'Base',
      startDate: new Date('2021-01-11'),
      phases: [
        { state: 'queued', startDate: new Date('2017-03-29'), color: '#fbbf24' },
        { state: 'indexing', startDate: new Date('2021-01-11'), color: '#3b82f6' }
      ]
    },
    {
      name: 'Linea',
      startDate: new Date('2022-07-03'),
      phases: [
        { state: 'queued', startDate: new Date('2017-03-29'), color: '#fbbf24' },
        { state: 'indexing', startDate: new Date('2022-07-03'), color: '#3b82f6' }
      ]
    }
  ];

  const currentDate = initialDate || new Date();

  // Timeline boundaries
  const timelineStart = new Date('2017-03-29'); // Ethereum start
  const timelineEnd = new Date(); // Today

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format short date for timeline
  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

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
      if (currentDate >= network.phases[i].startDate) {
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
          label: year.toString()
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
          <span>EVM Networks Indexing Timeline</span>
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-blue-600" />
            <span className="text-sm font-medium">{formatDate(currentDate)}</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Timeline header with years */}
        <div className="relative h-6 mb-1 mt-4">
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
        <div className="relative mb-4">
          {/* Timeline track */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-200"></div>

          {/* Current date indicator */}
          <div
            className="absolute h-full w-0.5 bg-red-500 z-20"
            style={{
              left: `${getTimelinePosition(currentDate)}%`,
              top: "0",
              bottom: "0",
              height: `${networks.length * 40 + 12}px`
            }}
          >
            <div className="absolute -top-6 -translate-x-1/2 whitespace-nowrap">
              <Badge variant="destructive" className="text-xs animate-pulse">Current</Badge>
            </div>
          </div>
        </div>

        {/* Network bars */}
        <div className="space-y-3">
          {networks.map((network) => {
            const currentPhase = getCurrentPhase(network);

            return (
              <div key={network.name} className="flex items-center">
                {/* Network label */}
                <div className="w-24 pr-3 text-sm font-medium">
                  {network.name}
                </div>

                {/* Network timeline bar */}
                <div className="relative flex-1 h-6">
                  {network.phases.map((phase, phaseIndex) => {
                    const nextPhaseDate = network.phases[phaseIndex + 1]?.startDate || currentDate;
                    const isActive = phase.state === currentPhase.state;

                    const startPos = getTimelinePosition(phase.startDate);
                    const endPos = getTimelinePosition(
                      phase.state === 'indexing' && currentDate > phase.startDate ?
                        currentDate : nextPhaseDate
                    );

                    const width = endPos - startPos;

                    // Skip rendering if width is zero or negative
                    if (width <= 0) return null;

                    // Skip rendering if this phase hasn't started yet
                    if (phase.startDate > currentDate) return null;

                    return (
                      <div
                        key={`${network.name}-${phase.state}`}
                        className="absolute h-5 rounded-sm z-10"
                        style={{
                          left: `${startPos}%`,
                          width: `${width}%`,
                          backgroundColor: phase.color,
                          opacity: isActive ? 1 : 0.7,
                          boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                          transition: 'width 0.3s ease'
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
                    className="absolute w-0.5 h-5 bg-gray-800 z-5"
                    style={{ left: `${getTimelinePosition(network.startDate)}%` }}
                  >
                    <div className="absolute top-6 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-xs text-gray-600">{formatShortDate(network.startDate)}</span>
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
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#fbbf24' }}></div>
            <span>Queued</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#3b82f6' }}></div>
            <span>Indexing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-3 bg-red-500"></div>
            <span>Current Date</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
