"use client";

import { ENSName } from "@/components/ens-name";
import { useIndexingStatus } from "@/components/indexing-status/hooks";
import { globalIndexingStatusViewModel } from "@/components/indexing-status/view-models";
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
import { useRecentDomains } from "./hooks";

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

// Helper function to generate ENS app URL for a domain
const getEnsAppUrl = (name: string) => {
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

export function RecentDomains() {
  const searchParams = useSearchParams();
  const recentDomainsQuery = useRecentDomains(searchParams);
  const indexingStatus = useIndexingStatus(searchParams);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get the current indexing date from the indexing status
  const currentIndexingDate = indexingStatus.data
    ? globalIndexingStatusViewModel(indexingStatus.data.runtime.networkIndexingStatusByChainId)
        .currentIndexingDate
    : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Latest .eth registrations</span>
          {currentIndexingDate && (
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-blue-600" />
              <span className="text-sm font-medium">
                Last indexed block on{" "}
                <FormattedDate
                  timestamp={(currentIndexingDate.getTime() / 1000).toString()}
                  options={{
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }}
                />
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentDomainsQuery.isLoading ? (
          <RecentDomainsFallback />
        ) : recentDomainsQuery.error ? (
          <div className="text-destructive">
            Error loading recent domains: {(recentDomainsQuery.error as Error).message}
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
                recentDomainsQuery.data?.registrations.map((registration) => (
                  <TableRow key={registration.domain.id}>
                    <TableCell className="font-medium">
                      <a
                        href={getEnsAppUrl(registration.domain.name)}
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
                      <ENSName address={registration.domain.owner.id} showAvatar={true} />
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

function RecentDomainsFallback() {
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
