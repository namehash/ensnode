import {ENSNamespaceId, getAddressDetailsUrl, getEnsNameDetailsUrl} from "@ensnode/datasources";
import { formatDistanceStrict, formatDistanceToNow, intlFormat } from "date-fns";
import { millisecondsInSecond } from "date-fns/constants";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import {Address} from "viem";

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
  namespaceId: ENSNamespaceId;
  name: string;
  showExternalLink?: boolean;
}

/**
 * Component to display an ENS name.
 * Optionally provides a link to the name details page on the ENS Manager App. If not, or if the ENS namespace has no known ENS Manager App, just displays the name (without link).
 */
//TODO: should probably be moved to /identity or somewhere else
export function NameDisplay({ name, namespaceId, showExternalLink }: NameDisplayProps) {
  const ensAppNameDetailsUrl = getEnsNameDetailsUrl(namespaceId, name);

  if (ensAppNameDetailsUrl) {
    return (
      <a
        href={ensAppNameDetailsUrl.toString()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
      >
        {name}
        {showExternalLink && <ExternalLink size={14} className="inline-block" />}
      </a>
    );
  }

  return <span className="font-medium">{name}</span>;
}

interface AddressDisplayProps {
  namespaceId: ENSNamespaceId;
  address: Address;
  showExternalLink?: boolean;
}

/**
 * Component to display a truncated address.
 * It displays a link to the address details page on ENS app, or just the address if the ENS namespace has no dedicated ENS App.
 */
export function AddressDisplay({ address, namespaceId, showExternalLink }: AddressDisplayProps) {
  // Truncate address for display
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const ensAppAddressDetailsUrl = getAddressDetailsUrl(namespaceId, address);

  if (ensAppAddressDetailsUrl) {
    return (
        <a
            href={ensAppAddressDetailsUrl.toString()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
        >
          {truncatedAddress}
          {showExternalLink && <ExternalLink size={14} className="inline-block" />}
        </a>
    );
  }

  return <span className="font-mono text-xs">{truncatedAddress}</span>;
}
