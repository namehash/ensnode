"use client";

import { RelativeTime, useNow } from "@namehash/namehash-ui";
import { InfoIcon } from "lucide-react";

import type { Duration, UnixTimestamp } from "@ensnode/ensnode-sdk";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectionInfoProps {
  snapshotTime: UnixTimestamp;
  worstCaseDistance: Duration;
}

/**
 * Displays metadata about the current indexing status projection in a tooltip.
 * Shows when the projection was generated, when the snapshot was taken, and worst-case distance.
 */
export function ProjectionInfo({ snapshotTime, worstCaseDistance }: ProjectionInfoProps) {
  const now = useNow();

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground w-8"
          aria-label="Indexing Status Metadata"
        >
          <InfoIcon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="bg-gray-50 text-sm text-black shadow-md outline-none w-80 p-4"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-xs text-gray-500 uppercase">
              Worst-Case Distance*
            </div>
            <div className="text-sm">
              {worstCaseDistance} second{worstCaseDistance !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="text-xs text-gray-600 leading-relaxed">
            * as of real-time projection generated just now from indexing status snapshot captured{" "}
            <RelativeTime
              timestamp={snapshotTime}
              relativeTo={now}
              includeSeconds
              conciseFormatting
            />
            .
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
