import { formatDistanceStrict, formatDistanceToNow, intlFormat } from "date-fns";
import { millisecondsInSecond } from "date-fns/constants";
import { useEffect, useState } from "react";
import {Address} from "viem";
import {Datasource, DatasourceNames, ENSNamespace, ENSNamespaces, getDatasourceMap} from "@ensnode/datasources";

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

 @param namespace - the namespace identifier within which to find a root datasource
 @returns the viem#Address object
 */
//TODO: where to sue it? I don't like the prop-drilling that would be required to pass the address from <RecentRegistrations /> to getEffectiveOwner, but what's a better way to do it?
export function getNameWrapperAddress(namespace: ENSNamespace): Address{
  const datasources = Object.values(getDatasourceMap(namespace)) as Datasource[];
  const datasource = datasources[DatasourceNames.ENSRoot];

  return datasource.contracts.NameWrapper.address;
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
