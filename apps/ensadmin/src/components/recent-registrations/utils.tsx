import { formatDistanceStrict, formatDistanceToNow, intlFormat } from "date-fns";
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
 * Parses a date object to a relative distance between such date and now
 *
 * @param enforcePast - if true, won't allow the result to relate to the future
 * @param includeSeconds - if true makes the base result consider seconds
 * @param conciseFormatting - if true removes prefixes from the base result
 */
export function parseRelativeTime(
    date: Date,
    enforcePast = false,
    includeSeconds = false,
    conciseFormatting = false,
) : string {
  if (enforcePast && date.getTime() >= Date.now()) {
    return "just now";
  }

  const relativeTime = formatDistanceToNow(date, { addSuffix: true, includeSeconds: includeSeconds });

  if (conciseFormatting) {
    return relativeTime.replace("less than ", "").replace("a minute", "1 minute");
  }

  return relativeTime;
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
    setRelativeTime(parseRelativeTime(date, enforcePast, includeSeconds, conciseFormatting));
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
