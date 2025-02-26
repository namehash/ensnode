"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface Network {
  name: string;
  startDate: Date;
  phases: Array<{
    state: "queued" | "indexing";
    startDate: Date;
    color: string;
  }>;
}

interface TimelineProps {
  networks?: Network[];
  currentDate?: Date;
}

export function IndexingTimeline({
  networks: initialNetworks,
  currentDate: initialDate,
}: TimelineProps) {
  // Sample networks data if none provided
  const networks = initialNetworks || [
    {
      name: "Ethereum",
      startDate: new Date("2017-03-29"),
      phases: [{ state: "indexing", startDate: new Date("2017-03-29"), color: "#3b82f6" }],
    },
    {
      name: "Base",
      startDate: new Date("2021-01-11"),
      phases: [
        { state: "queued", startDate: new Date("2017-03-29"), color: "#fbbf24" },
        { state: "indexing", startDate: new Date("2021-01-11"), color: "#3b82f6" },
      ],
    },
    {
      name: "Linea",
      startDate: new Date("2022-07-03"),
      phases: [
        { state: "queued", startDate: new Date("2017-03-29"), color: "#fbbf24" },
        { state: "indexing", startDate: new Date("2022-07-03"), color: "#3b82f6" },
      ],
    },
  ];

  const currentDate = initialDate || new Date();

  // Timeline boundaries
  const timelineStart = new Date("2017-03-29"); // Ethereum start
  const timelineEnd = new Date(); // Today

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format short date for timeline
  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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
              height: `${networks.length * 40 + 12}px`,
            }}
          >
            <div className="absolute -top-6 -translate-x-1/2 whitespace-nowrap">
              <Badge variant="destructive" className="text-xs animate-pulse">
                Current
              </Badge>
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
                <div className="w-24 pr-3 text-sm font-medium">{network.name}</div>

                {/* Network timeline bar */}
                <div className="relative flex-1 h-6">
                  {network.phases.map((phase, phaseIndex) => {
                    const nextPhaseDate = network.phases[phaseIndex + 1]?.startDate || currentDate;
                    const isActive = phase.state === currentPhase.state;

                    const startPos = getTimelinePosition(phase.startDate);
                    const endPos = getTimelinePosition(
                      phase.state === "indexing" && currentDate > phase.startDate
                        ? currentDate
                        : nextPhaseDate,
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
                    className="absolute w-0.5 h-5 bg-gray-800 z-5"
                    style={{ left: `${getTimelinePosition(network.startDate)}%` }}
                  >
                    <div className="absolute top-6 -translate-x-1/2 whitespace-nowrap">
                      <span className="text-xs text-gray-600">
                        {formatShortDate(network.startDate)}
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
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#fbbf24" }}></div>
            <span>Queued</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#3b82f6" }}></div>
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
