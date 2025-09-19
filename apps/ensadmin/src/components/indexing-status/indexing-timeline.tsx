/**
 * This file gathers ideas for UI components presenting chain indexing timeline.
 */

import { cn } from "@/lib/utils";
import { ChainId, ChainIndexingStatusIds, UnixTimestamp } from "@ensnode/ensnode-sdk";
import { intlFormat } from "date-fns";

import { ChainIcon } from "@/components/chains/ChainIcon";
import { AbsoluteTime } from "@/components/datetime-utils";
import { BlockRefViewModel } from "@/components/indexing-status/block-refs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getChainName } from "@/lib/namespace-utils";
import { getTimelinePosition } from "./indexing-timeline-utils";

interface ChainIndexingTimelinePhaseViewModel {
  status: typeof ChainIndexingStatusIds.Queued | typeof ChainIndexingStatusIds.Backfill;
  startsAt: UnixTimestamp;
  endsAt: UnixTimestamp;
}

interface ChainIndexingTimelinePhaseProps {
  phase: ChainIndexingTimelinePhaseViewModel;
  isActive: boolean;
  timelineStartsAt: UnixTimestamp;
  timelineEndsAt: UnixTimestamp;
}

/**
 * Component to display a single indexing phase,
 * such as {@link ChainIndexingStatusIds.Queued}
 * or {@link ChainIndexingStatusIds.Backfill}, on the chain indexing timeline.
 */
function ChainIndexingTimelinePhase({
  phase,
  isActive,
  timelineStartsAt,
  timelineEndsAt,
}: ChainIndexingTimelinePhaseProps) {
  const startPos = getTimelinePosition(phase.startsAt, timelineStartsAt, timelineEndsAt);
  const endPos = phase.endsAt
    ? getTimelinePosition(phase.endsAt, timelineStartsAt, timelineEndsAt)
    : 100;

  const width = endPos - startPos;

  // Skip rendering if width is zero or negative
  if (width <= 0) return null;

  return (
    <div
      className={cn("absolute h-5 rounded-sm z-10", {
        "bg-gray-400": phase.status === ChainIndexingStatusIds.Queued,
        "bg-blue-500": phase.status === ChainIndexingStatusIds.Backfill,
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
          {phase.status}
        </span>
      )}
    </div>
  );
}

/**
 * Get the current phase of the chain indexing timeline.
 *
 * @param omnichainIndexingCursor unix timestamp
 * @param chainStatus view model
 */
function currentPhase(
  omnichainIndexingCursor: UnixTimestamp,
  chainStatus: {
    phases: ChainIndexingTimelinePhaseViewModel[];
  },
): ChainIndexingTimelinePhaseViewModel {
  for (let i = chainStatus.phases.length - 1; i >= 0; i--) {
    if (omnichainIndexingCursor >= chainStatus.phases[i].startsAt) {
      return chainStatus.phases[i];
    }
  }

  return chainStatus.phases[0];
}

interface ChainIndexingTimelineProps {
  omnichainIndexingCursor: UnixTimestamp;
  timelineStartsAt: UnixTimestamp;
  timelineEndsAt: UnixTimestamp;
  chainStatus: {
    chainId: ChainId;
    firstBlockToIndex: BlockRefViewModel;
    lastIndexedBlock: BlockRefViewModel | null;
    phases: ChainIndexingTimelinePhaseViewModel[];
  };
}

/**
 * Component to display chain indexing status for a single chain.
 * Includes a timeline bar for each indexing phase.
 */
export function ChainIndexingTimeline(props: ChainIndexingTimelineProps) {
  const { omnichainIndexingCursor, chainStatus, timelineStartsAt, timelineEndsAt } = props;
  const currentIndexingPhase = currentPhase(omnichainIndexingCursor, chainStatus);

  return (
    <div key={chainStatus.chainId} className="flex items-center">
      {/* ChainName label */}
      <div className="pr-6 flex flex-col">
        <Tooltip>
          <TooltipTrigger className="cursor-default">
            <ChainIcon chainId={chainStatus.chainId} />
          </TooltipTrigger>
          <TooltipContent
            side="left"
            className="bg-gray-50 text-sm text-black text-center shadow-md outline-none w-fit"
          >
            {getChainName(chainStatus.chainId)}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Chain timeline bar */}
      <div className="relative flex-1 h-6">
        {chainStatus.phases.map((phase) => (
          <ChainIndexingTimelinePhase
            key={`${chainStatus.chainId}-${phase.status}`}
            phase={phase}
            isActive={phase === currentIndexingPhase}
            timelineStartsAt={timelineStartsAt}
            timelineEndsAt={timelineEndsAt}
          />
        ))}

        {/* Chain start indicator */}
        <div
          className="absolute w-0.5 h-5 bg-gray-800 z-10"
          style={{
            left: `${getTimelinePosition(
              chainStatus.firstBlockToIndex.timestamp,
              timelineStartsAt,
              timelineEndsAt,
            )}%`,
          }}
        >
          <div className="absolute top-4 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs text-gray-600">
              <AbsoluteTime
                timestamp={chainStatus.firstBlockToIndex.timestamp}
                options={{
                  dateStyle: "medium",
                }}
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
