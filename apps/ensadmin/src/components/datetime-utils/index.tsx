import { Tooltip, TooltipContent, TooltipPosition, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistance, formatDistanceStrict, intlFormat } from "date-fns";
import { millisecondsInSecond } from "date-fns/constants";
import { useEffect, useState } from "react";
import * as React from "react";

/**
 * Client-only absolute time component
 */
export function AbsoluteTime({
  date,
  options,
}: {
  date: Date;
  options: Intl.DateTimeFormatOptions;
}) {
  const [absoluteTime, setAbsoluteTime] = useState<string>("");

  useEffect(() => {
    setAbsoluteTime(intlFormat(date, options));
  }, [date, options]);

  return <>{absoluteTime}</>;
}

/**
 * Formats a Date as its relative distance with now
 *
 * @param enforcePast - if true, enforces that the return value won't relate to the future.
 * Helpful for UI contexts where its nonsensical for a value to relate to the future. Ex: how long ago an event happened.
 * Note how different systems may have misaligned clocks. `enforcePast` aims to protect from UI confusion when
 * the client's clock is set incorrectly in the past, such that events happening "now" might otherwise appear to
 * be coming from the future.
 * @param includeSeconds - if true includes seconds in the result
 * @param conciseFormatting - if true removes special prefixes / suffixes such as "about ..." or "in almost ..."
 * @param relativeTo - if defined represents the date to compare with. Otherwise, the date param is compared with the present.
 */
export function formatRelativeTime(
  date: Date,
  enforcePast = false,
  includeSeconds = false,
  conciseFormatting = false,
  relativeTo?: Date,
): string {
  const compareWith = relativeTo ? relativeTo.getTime() : Date.now();

  if (enforcePast && date.getTime() >= compareWith) {
    return "just now";
  }

  if (conciseFormatting) {
    return formatDistanceStrict(date, compareWith, { addSuffix: true });
  }

  const formattedDistance = formatDistance(date, compareWith, {
    addSuffix: true,
    includeSeconds,
  });

  return formattedDistance !== "less than a minute ago" ? formattedDistance : "just now";
}

/**
 * Client-only relative time component
 */
export function RelativeTime({
  date,
  enforcePast = false,
  includeSeconds = false,
  conciseFormatting = false,
  tooltipPosition = TooltipPosition.TOP,
  relativeTo,
  prefix,
}: {
  date: Date;
  enforcePast?: boolean;
  includeSeconds?: boolean;
  conciseFormatting?: boolean;
  tooltipPosition?: TooltipPosition;
  relativeTo?: Date;
  prefix?: string;
}) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    setRelativeTime(
      formatRelativeTime(date, enforcePast, includeSeconds, conciseFormatting, relativeTo),
    );
  }, [date]);

  return (
    <Tooltip delayDuration={2000}>
      <TooltipTrigger className="cursor-text">
        {prefix}
        {relativeTime}
      </TooltipTrigger>
      <TooltipContent
        side={tooltipPosition}
        className="bg-gray-50 text-sm text-black text-center shadow-md outline-none w-fit"
      >
        <AbsoluteTime
          date={date}
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
  beginsAt: Date;
  endsAt: Date;
}) {
  const [duration, setDuration] = useState<string>("");

  useEffect(() => {
    setDuration(formatDistanceStrict(endsAt, beginsAt));
  }, [beginsAt, endsAt]);

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
