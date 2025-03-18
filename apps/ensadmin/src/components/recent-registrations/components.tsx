"use client";

import { ENSName } from "@/components/ens-name";
import { useIndexedChainId, useIndexingStatusQuery } from "@/components/ensnode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { differenceInYears, formatDistanceToNow, fromUnixTime, intlFormat } from "date-fns";
import { Clock, ExternalLink } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Hex, getAddress, isAddressEqual } from "viem";
import { useRecentRegistrations, useRegistrationsStartBlock } from "./hooks";

// Helper function to get formatted date for display
const getFormattedDateString = (date: Date): string => {
  return intlFormat(date, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Helper function to safely format dates
const formatDate = (timestamp: string, options: Intl.DateTimeFormatOptions) => {
  try {
    const parsedTimestamp = parseInt(timestamp);
    if (isNaN(parsedTimestamp)) {
      return "Invalid date";
    }
    return intlFormat(fromUnixTime(parsedTimestamp), options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

// Helper function to calculate duration in years
const calculateDurationYears = (registrationDate: string, expiryDate: string) => {
  try {
    const registrationTimestamp = parseInt(registrationDate);
    const expiryTimestamp = parseInt(expiryDate);

    if (isNaN(registrationTimestamp) || isNaN(expiryTimestamp)) {
      return "Unknown";
    }

    const registrationDate_ = fromUnixTime(registrationTimestamp);
    const expiryDate_ = fromUnixTime(expiryTimestamp);
    const years = differenceInYears(expiryDate_, registrationDate_);

    // If less than a year, show months instead
    if (years === 0) {
      // Calculate months by getting the difference in milliseconds and converting to months
      const diffInMs = expiryDate_.getTime() - registrationDate_.getTime();
      const months = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 30));
      return `${months} month${months !== 1 ? "s" : ""}`;
    }

    return `${years} year${years !== 1 ? "s" : ""}`;
  } catch (error) {
    console.error("Error calculating duration:", error);
    return "Unknown";
  }
};

// Helper function to format relative time
const formatRelativeTime = (timestamp: string) => {
  try {
    const parsedTimestamp = parseInt(timestamp);
    if (isNaN(parsedTimestamp)) {
      return "Unknown";
    }

    const date = fromUnixTime(parsedTimestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "Unknown";
  }
};

// Helper function to generate ENS app URL for a name
const getEnsAppUrlForName = (name: string) => {
  return `https://app.ens.domains/${name}`;
};

// Client-only date formatter component
function FormattedDate({
  timestamp,
  options,
}: { timestamp: string; options: Intl.DateTimeFormatOptions }) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    setFormattedDate(formatDate(timestamp, options));
  }, [timestamp, options]);

  return <>{formattedDate}</>;
}

// Client-only relative time component
function RelativeTime({ timestamp }: { timestamp: string }) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    setRelativeTime(formatRelativeTime(timestamp));
  }, [timestamp]);

  return <>{relativeTime}</>;
}

// Client-only duration component
function Duration({
  registrationDate,
  expiryDate,
}: { registrationDate: string; expiryDate: string }) {
  const [duration, setDuration] = useState<string>("");

  useEffect(() => {
    setDuration(calculateDurationYears(registrationDate, expiryDate));
  }, [registrationDate, expiryDate]);

  return <>{duration}</>;
}

// The NameWrapper contract address
const NAME_WRAPPER_ADDRESS = "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401";

/**
 * Determines the true owner of a domain.
 * If the owner is the NameWrapper contract, returns the wrapped owner instead.
 *
 * @param owner The owner address
 * @param wrappedOwner The wrapped owner address (optional)
 * @returns The true owner address
 */
function getTrueOwner(owner: { id: Hex }, wrappedOwner?: { id: Hex }) {
  // Only use wrapped owner if the owner is the NameWrapper contract
  if (wrappedOwner?.id && isAddressEqual(owner.id, NAME_WRAPPER_ADDRESS)) {
    return getAddress(wrappedOwner.id);
  }

  // Otherwise, use the regular owner
  return getAddress(owner.id);
}

export function RecentRegistrations() {
  const searchParams = useSearchParams();
  const recentRegistrationsQuery = useRecentRegistrations(searchParams);
  const indexingStatus = useIndexingStatusQuery(searchParams);
  const registrationsStartBlock = useRegistrationsStartBlock(indexingStatus.data);
  const indexedChainId = useIndexedChainId(indexingStatus.data);
  const [isClient, setIsClient] = useState(false);

  console.log("registrationsStartBlock", registrationsStartBlock);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get the current indexing block from the indexing status
  const mainnetStatuses = indexingStatus.data?.runtime.networkIndexingStatusByChainId;
  const mainnetStatus = mainnetStatuses ? mainnetStatuses[1] : null; // mainnet chainId is 1
  const lastIndexedBlock = mainnetStatus?.lastIndexedBlock?.number || 0;
  const lastIndexedBlockDate = mainnetStatus?.lastIndexedBlock?.timestamp
    ? new Date(mainnetStatus.lastIndexedBlock.timestamp * 1000)
    : null;

  // If possible, check if the current indexing block is before the BaseRegistrar start block
  const isBeforeBaseRegistrarBlock = registrationsStartBlock?.number
    ? lastIndexedBlock < registrationsStartBlock.number
    : false;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Latest .eth registrations</span>
          {lastIndexedBlock > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-blue-600" />
              <span className="text-sm font-medium">
                Last indexed block: {lastIndexedBlock}
                {lastIndexedBlockDate && (
                  <span className="ml-1 text-muted-foreground">
                    ({getFormattedDateString(lastIndexedBlockDate)})
                  </span>
                )}
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isBeforeBaseRegistrarBlock && registrationsStartBlock ? (
          <div className="py-4 text-left text-sm text-muted-foreground">
            <p className="mb-2">
              Latest indexed .eth registrations will be displayed here after blocks from{" "}
              <pre className="inline">{registrationsStartBlock.number}</pre> are indexed
              <time className="ml-1" dateTime={registrationsStartBlock.date.toISOString()} title={registrationsStartBlock.date.toISOString()}>
                ({getFormattedDateString(registrationsStartBlock.date)})
              </time>
              .
            </p>
            <p>
              While .eth domains are indexed before this date, .eth registrations are not.
            </p>
          </div>
        ) : recentRegistrationsQuery.isLoading ? (
          <RecentRegistrationsFallback />
        ) : recentRegistrationsQuery.error ? (
          <div className="text-destructive">
            Error loading recent registrations: {(recentRegistrationsQuery.error as Error).message}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isClient &&
                recentRegistrationsQuery.data?.registrations.map((registration) => (
                  <TableRow key={registration.domain.name}>
                    <TableCell className="font-medium">
                      <a
                        href={getEnsAppUrlForName(registration.domain.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        {registration.domain.name}
                        <ExternalLink size={14} className="inline-block" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <RelativeTime timestamp={registration.registrationDate} />
                    </TableCell>
                    <TableCell>
                      <Duration
                        registrationDate={registration.registrationDate}
                        expiryDate={registration.expiryDate}
                      />
                    </TableCell>
                    <TableCell>
                      {indexedChainId ? (
                        <ENSName
                          address={getTrueOwner(
                            registration.domain.owner,
                            registration.domain.wrappedOwner,
                          )}
                          chainId={indexedChainId}
                          showAvatar={true}
                        />
                      ) : (
                        <ENSName.Placeholder showAvatar={true} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function RecentRegistrationsFallback() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-muted rounded w-full"></div>
      <div className="h-10 bg-muted rounded w-full"></div>
      <div className="h-10 bg-muted rounded w-full"></div>
      <div className="h-10 bg-muted rounded w-full"></div>
      <div className="h-10 bg-muted rounded w-full"></div>
    </div>
  );
}
