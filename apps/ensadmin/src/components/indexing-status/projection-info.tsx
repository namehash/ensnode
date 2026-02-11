"use client";

import { formatRelativeTime, RelativeTime, useNow } from "@namehash/namehash-ui";
import { InfoIcon } from "lucide-react";

import type { Duration, UnixTimestamp } from "@ensnode/ensnode-sdk";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Formats the worst-case distance for display in the projection info tooltip.
 *
 * If the worst-case distance is 1 minute or less, we present it as
 * an absolute number of seconds (e.g. "45 seconds").
 *
 * Otherwise, we present it as a relative time (e.g. "2 hours ago") instead of
 * an absolute number of seconds. Also, we drop the "ago" suffix from
 * the relative time string to focus on the distance aspect
 * (e.g. "2 hours" instead of "2 hours ago").
 */
const formatWorstCaseDistance = (
  worstCaseDistance: Duration,
  omnichainIndexingCursor: UnixTimestamp,
) => {
  const presentWorstCaseDistanceAsRelativeTime = worstCaseDistance > 60;

  if (presentWorstCaseDistanceAsRelativeTime) {
    return formatRelativeTime(omnichainIndexingCursor, true, true, true).replace(" ago", "");
  }

  return `${worstCaseDistance} seconds`;
};

interface ProjectionInfoProps {
  omnichainIndexingCursor: UnixTimestamp;
  snapshotTime: UnixTimestamp;
  worstCaseDistance: Duration;
}

/**
 * Displays metadata about the current indexing status projection in a tooltip.
 * Shows when the projection was generated, when the snapshot was taken, and worst-case distance.
 */
export function ProjectionInfo({
  omnichainIndexingCursor,
  snapshotTime,
  worstCaseDistance,
}: ProjectionInfoProps) {
  const now = useNow();
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <InfoIcon className="shrink-0 text-[#9CA3AF] w-4 h-4" />
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
              {formatWorstCaseDistance(worstCaseDistance, omnichainIndexingCursor)}
            </div>
          </div>

          <div className="text-xs text-gray-600 leading-relaxed">
            * as of the real-time projection generated just now from indexing status snapshot
            captured{" "}
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
