import {
  ENSNamespaceId,
  getEnsNameDetailsUrl
} from "@ensnode/datasources";
import { formatDistanceStrict, formatDistanceToNow, intlFormat } from "date-fns";
import { millisecondsInSecond } from "date-fns/constants";
import { ExternalLink } from "lucide-react";
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

interface NameDisplayProps {
  namespaceId: ENSNamespaceId
  ensName: string;
  showExternalLink?: boolean;
}

/**
 * Component to display an ENS registration.
 * It can display a link to the ENS name, or just the name if the ENS namespace has no dedicated ENS App.
 */

//TODO: consider a different name
//TODO: should probably be moved to /identity or somewhere else
export function NameDisplay({ ensName, namespaceId, showExternalLink}: NameDisplayProps) {
  const ensAppNameDetailsUrl = getEnsNameDetailsUrl(namespaceId, ensName);

  if (ensAppNameDetailsUrl) {
    return (
      <a
        href={ensAppNameDetailsUrl.toString()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
      >
        {ensName}
        {showExternalLink && <ExternalLink size={14} className="inline-block" />}
      </a>
    );
  }

  return <span className="font-medium">{ensName}</span>;
}
