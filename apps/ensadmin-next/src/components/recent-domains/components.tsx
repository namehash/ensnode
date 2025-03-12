"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fromUnixTime, intlFormat } from "date-fns";
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

export function RecentDomains() {
  const searchParams = useSearchParams();
  const recentDomainsQuery = useRecentDomains(searchParams);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Latest .eth registrations</CardTitle>
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
                <TableHead>Registration Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isClient &&
                recentDomainsQuery.data?.registrations.map((registration) => (
                  <TableRow key={registration.domain.id}>
                    <TableCell className="font-medium">{registration.domain.name}</TableCell>
                    <TableCell>
                      <FormattedDate
                        timestamp={registration.registrationDate}
                        options={{
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <FormattedDate
                        timestamp={registration.expiryDate}
                        options={{
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {registration.domain.owner.id}
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
