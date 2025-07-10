import { formatDistance, formatDistanceStrict, intlFormat } from "date-fns";
import { millisecondsInSecond } from "date-fns/constants";
import { useEffect, useState } from "react";

/**
 * Client-only date formatter component
 */
export function FormattedDate({
  date,
  options,
}: {
  date: Date;
  options: Intl.DateTimeFormatOptions;
}) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    setFormattedDate(intlFormat(date, options));
  }, [date, options]);

  return <>{formattedDate}</>;
}

/**
 * Formats a Date as its relative distance with now
 *
 * @param enforcePast - iif true, enforces that the return value won't relate to the future.
 * Helpful for UI contexts where its nonsensical for a value to relate to the future. Ex: how long ago an event happened.
 * @param includeSeconds - if true includes seconds in the result
 * @param conciseFormatting - if true removes special prefixes
 */
export function formatRelativeTime(
  date: Date,
  enforcePast = false,
  includeSeconds = false,
  conciseFormatting = false,
): string {
  const now = Date.now();

  if (enforcePast && date.getTime() >= now) {
    return "just now";
  }

  if (conciseFormatting) {
    return formatDistanceStrict(date, now, { addSuffix: true });
  }

  return formatDistance(date, now, {
    addSuffix: true,
    includeSeconds,
  });
}

/**
 * Client-only relative time component
 */
export function RelativeTime({
  date,
  enforcePast = false,
  includeSeconds = false,
  conciseFormatting = false,
}: { date: Date; enforcePast?: boolean; includeSeconds?: boolean; conciseFormatting?: boolean }) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    setRelativeTime(formatRelativeTime(date, enforcePast, includeSeconds, conciseFormatting));
  }, [date]);

  return <>{relativeTime}</>;
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
