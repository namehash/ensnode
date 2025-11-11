"use client";

import { InfoIcon } from "lucide-react";

import type { RealtimeIndexingStatusProjection } from "@ensnode/ensnode-sdk";

import { RelativeTime } from "@/components/datetime-utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectionInfoProps {
  realtimeProjection: RealtimeIndexingStatusProjection;
}

/**
 * Displays metadata about the current indexing status projection in a tooltip.
 * Shows when the projection was generated, when the snapshot was taken, and worst-case distance.
 */
export function ProjectionInfo({ realtimeProjection }: ProjectionInfoProps) {
  const { projectedAt, snapshot, worstCaseDistance } = realtimeProjection;
  const { snapshotTime } = snapshot;

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8"
          aria-label="Projection information"
        >
          <InfoIcon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="bg-gray-50 text-sm text-black shadow-md outline-none w-64 p-4"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-xs text-gray-500 uppercase">Projection from</div>
            <div className="text-sm">
              <RelativeTime timestamp={projectedAt} includeSeconds />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="font-semibold text-xs text-gray-500 uppercase">Snapshot from</div>
            <div className="text-sm">
              <RelativeTime timestamp={snapshotTime} includeSeconds />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="font-semibold text-xs text-gray-500 uppercase">Worst-case distance</div>
            <div className="text-sm">
              {worstCaseDistance !== null ? `${worstCaseDistance} seconds` : "N/A"}
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
