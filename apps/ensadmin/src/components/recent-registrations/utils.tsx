import { formatDistanceStrict, formatDistanceToNow, intlFormat } from "date-fns";
import { useEffect, useState } from "react";
import {Address} from "viem";
import {
  Datasource,
  DatasourceNames,
  ENSNamespaceId,
  getENSNamespace
} from "@ensnode/datasources";

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
 Get an Address object of the NameWrapper contract from the root datasource of a specific namespace.

 @param chainId the chain ID
 @param namespaceId - the namespace identifier within which to find a root datasource
 @returns the viem#Address object
 */
//TODO: where to use it? I don't like the prop-drilling that would be required to pass the address from <RecentRegistrations /> to getEffectiveOwner, but what's a better way to do it?
export function getNameWrapperAddress(namespaceId: ENSNamespaceId, chainId: number): Address{
  const datasources = Object.values(getENSNamespace(namespaceId)) as Datasource[];
  const datasource = datasources.find((datasource) => datasource.chain.id === chainId);

  if (!datasource) {
    throw new Error(
        `No Datasources within the "${namespaceId}" namespace are defined for Chain ID "${chainId}".`,
    );
  }

  return datasource.contracts.NameWrapper.address;
}
