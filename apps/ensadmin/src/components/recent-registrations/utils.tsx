import { Registration } from "@/components/recent-registrations/types";
import {
  DatasourceNames,
  ENSNamespaceId,
  getDatasource
} from "@ensnode/datasources";
import { formatDistanceStrict, formatDistanceToNow, intlFormat } from "date-fns";
import { millisecondsInSecond } from "date-fns/constants";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Address, getAddress } from "viem";

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

/**
 * Truncates a name's leftmost label if it's made of an address
 */
//TODO: improve name and description
//TODO: refactor the code
function truncateLeftmostLabelIfItContainsAddress(name: string): string {
  const leftmostLabel = name.split(".")[0];

  //if name's label is an address (ex. [ec93f85a766b60d85571efc48e4b818c800218452f9ac738f796a8fc94079a57].eth) truncate it
  if (leftmostLabel.startsWith("[") && leftmostLabel.endsWith("]")) {
    return `${leftmostLabel.slice(0, 6)}...${name.slice(-3)}${name.split(".").slice(1).join(".")}`;
  }

  // otherwise return whole domain
  return name;
}

interface RegistrationNameDisplayProps {
  // NOTE: not every ENS namespace has an ENS app URL
  ensAppUrl: URL | undefined;

  registration: Registration;
}

/**
 * Component to display an ENS registration.
 * It can display a link to the ENS name, or just the name if the ENS namespace has no dedicated ENS App.
 */

//TODO: consider a different name
//TODO: should probably be moved to /identity
//TODO: for now this handles the case of undefined ENS app URLs - may change depending on other TODOs
export function RegistrationNameDisplay({ registration, ensAppUrl }: RegistrationNameDisplayProps) {
  const ensAppRegistrationPreviewUrl = ensAppUrl
    ? new URL(registration.name, ensAppUrl)
    : undefined;

  const displayName = truncateLeftmostLabelIfItContainsAddress(registration.name);

  if (ensAppRegistrationPreviewUrl) {
    return (
      <a
        href={ensAppRegistrationPreviewUrl.toString()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-blue-600 hover:underline"
      >
        {displayName}
        <ExternalLink size={14} className="inline-block" />
      </a>
    );
  }

  return <span>{displayName}</span>;
}

/**
 Get an Address object of the NameWrapper contract from the root datasource of a specific namespace.

 @param chainId the chain ID
 @param namespaceId - the namespace identifier within which to find a root datasource
 @returns the viem#Address object
 */
export function getNameWrapperAddress(namespaceId: ENSNamespaceId, chainId: number): Address {
  const datasource = getDatasource(namespaceId, DatasourceNames.ENSRoot);

  // always request NameWrapper address from root datasource otherwise not throw error
  if (datasource.chain.id !== chainId){
    throw new Error(`Chain of id=${chainId} is not a namespace's root datasource's chain`)
  }

  return getAddress(datasource.contracts.NameWrapper.address);
}
