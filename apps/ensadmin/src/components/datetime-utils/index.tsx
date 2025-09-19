import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UnixTimestamp } from "@ensnode/ensnode-sdk";
import { formatDistance, formatDistanceStrict, fromUnixTime, intlFormat } from "date-fns";
import { millisecondsInSecond } from "date-fns/constants";
import { useEffect, useState } from "react";
import * as React from "react";

/**
 * Client-only absolute time component
 */
export function AbsoluteTime({
  timestamp,
  options,
}: {
  timestamp: UnixTimestamp;
  options: Intl.DateTimeFormatOptions;
}) {
  const date = fromUnixTime(timestamp);
  const [absoluteTime, setAbsoluteTime] = useState<string>("");

  useEffect(() => {
    setAbsoluteTime(intlFormat(date, options));
  }, [date, options]);

  return <>{absoluteTime}</>;
}

/**
 * Formats a Unix timestamp as its relative distance with now
 *
 * @param enforcePast - if true, enforces that the return value won't relate to the future.
 * Helpful for UI contexts where its nonsensical for a value to relate to the future. Ex: how long ago an event happened.
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
  relativeTo,
  prefix,
}: {
  timestamp: UnixTimestamp;
  enforcePast?: boolean;
  includeSeconds?: boolean;
  conciseFormatting?: boolean;
  tooltipPosition?: React.ComponentProps<typeof TooltipContent>["side"];
  relativeTo?: UnixTimestamp;
  prefix?: string;
}) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    setRelativeTime(
      formatRelativeTime(timestamp, enforcePast, includeSeconds, conciseFormatting, relativeTo),
    );
  }, [timestamp]);

  return (
    <Tooltip delayDuration={1000}>
      <TooltipTrigger className="cursor-text">
        {prefix}
        {relativeTime}
      </TooltipTrigger>
      <TooltipContent
        side={tooltipPosition}
        className="bg-gray-50 text-sm text-black text-center shadow-md outline-none w-fit"
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
        />
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Client-only duration component
 */
export function Duration({
  beginsAt,
  endsAt,
}: {
  beginsAt: UnixTimestamp;
  endsAt: UnixTimestamp;
}) {
  const [duration, setDuration] = useState<string>("");
  const beginsAtDate = fromUnixTime(beginsAt);
  const endsAtDate = fromUnixTime(endsAt);

  useEffect(() => {
    setDuration(formatDistanceStrict(endsAtDate, beginsAtDate));
  }, [beginsAtDate, endsAtDate]);

  return <>{duration}</>;
}

/**
 * An integer value (representing a Unix timestamp in seconds) formatted as a string.
 */
export type UnixTimestampInSeconds = string;

/**
 * Transforms a UnixTimestampInSeconds to a Date object.
 */
export function unixTimestampToDate(timestamp: UnixTimestampInSeconds): Date {
  const date = new Date(parseInt(timestamp) * millisecondsInSecond);

  if (isNaN(date.getTime())) {
    throw new Error(`Error parsing timestamp (${timestamp}) to date`);
  }

  return date;
}
