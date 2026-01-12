import { formatDistance, formatDistanceStrict, fromUnixTime } from "date-fns";
import { millisecondsInSecond } from "date-fns/constants";
import type * as React from "react";
import { useEffect, useState } from "react";

import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import { AbsoluteTime } from "@/components/datetime/AbsoluteTime.tsx";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { cn } from "@/utils/cn.ts";

/**
 * Formats a Unix timestamp as its relative distance with now
 *
 * @param timestamp - the timestamp to format as a relative time
 * @param enforcePast - if true, enforces that the return value won't relate to the future.
 * Helpful for UI contexts where it's nonsensical for a value to relate to the future. Ex: how long ago an event happened.
 * Note how different systems may have misaligned clocks. `enforcePast` aims to protect from UI confusion when
 * the client's clock is set incorrectly in the past, such that events happening "now" might otherwise appear to
 * be coming from the future.
 * @param includeSeconds - if true includes seconds in the result
 * @param conciseFormatting - if true removes special prefixes / suffixes such as "about ..." or "in almost ..."
 * @param relativeTo - if defined represents the timestamp to compare with. Otherwise, the timestamp param is compared with the present.
 */
export function formatRelativeTime(
  timestamp: UnixTimestamp,
  enforcePast = false,
  includeSeconds = false,
  conciseFormatting = false,
  relativeTo?: UnixTimestamp,
): string {
  const date = fromUnixTime(timestamp);
  const compareWith = typeof relativeTo !== "undefined" ? fromUnixTime(relativeTo) : new Date();

  if (
    (enforcePast && date >= compareWith) ||
    (!includeSeconds &&
      !conciseFormatting &&
      Math.abs(date.getTime() - compareWith.getTime()) < 60 * millisecondsInSecond)
  ) {
    return "just now";
  }

  if (conciseFormatting) {
    return formatDistanceStrict(date, compareWith, { addSuffix: true });
  }

  return formatDistance(date, compareWith, {
    addSuffix: true,
    includeSeconds,
  });
}

/**
 * Client-only relative time component
 */
export function RelativeTime({
  timestamp,
  enforcePast = false,
  includeSeconds = false,
  conciseFormatting = false,
  tooltipPosition = "top",
  tooltipStyles,
  relativeTo,
  prefix,
  contentWrapper,
}: {
  timestamp: UnixTimestamp;
  enforcePast?: boolean;
  includeSeconds?: boolean;
  conciseFormatting?: boolean;
  tooltipPosition?: React.ComponentProps<typeof TooltipContent>["side"];
  tooltipStyles?: string;
  relativeTo?: UnixTimestamp;
  prefix?: string;
  /**
   * A component to be rendered as a wrapper for the Relative Time component content.
   */
  contentWrapper?: ({ children }: React.PropsWithChildren) => React.ReactNode;
}) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    setRelativeTime(
      formatRelativeTime(timestamp, enforcePast, includeSeconds, conciseFormatting, relativeTo),
    );
  }, [timestamp, conciseFormatting, enforcePast, includeSeconds, relativeTo]);

  const tooltipTriggerContent = (
    <>
      {prefix}
      {relativeTime}
    </>
  );

  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger className="nhui:cursor-text">
        {typeof contentWrapper === "function"
          ? contentWrapper({ children: tooltipTriggerContent })
          : tooltipTriggerContent}
      </TooltipTrigger>
      <TooltipContent
        side={tooltipPosition}
        className={cn(
          "nhui:bg-[#171717] nhui:text-xs nhui:text-white nhui:text-left nhui:shadow-md nhui:outline-none nhui:w-fit nhui:duration-0",
          tooltipStyles,
        )}
      >
        <AbsoluteTime
          timestamp={timestamp}
          options={{
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true,
          }}
        />{" "}
        (Local time)
        <br />
        <AbsoluteTime
          timestamp={timestamp}
          options={{
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true,
            timeZone: "UTC",
          }}
        />{" "}
        (UTC)
        <TooltipArrow width={12} height={8} />
      </TooltipContent>
    </Tooltip>
  );
}

// TODO: Copied from ENSAwards - some alignment made but further changes may be needed
