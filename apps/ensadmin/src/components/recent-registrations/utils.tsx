import { formatDistanceStrict, formatDistanceToNow, intlFormat } from "date-fns";
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
 * Client-only relative time component
 */
export function RelativeTime({ date }: { date: Date }) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    setRelativeTime(formatDistanceToNow(date, { addSuffix: true }));
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
