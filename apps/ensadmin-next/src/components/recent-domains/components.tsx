"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fromUnixTime, intlFormat } from "date-fns";
import { useSearchParams } from "next/navigation";
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

export function RecentDomains() {
  const searchParams = useSearchParams();
  const recentDomainsQuery = useRecentDomains(searchParams);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recently Registered Domains</CardTitle>
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
              {recentDomainsQuery.data?.domains.map((domain) => (
                <TableRow key={domain.id}>
                  <TableCell className="font-medium">{domain.name}</TableCell>
                  <TableCell>
                    {formatDate(domain.createdAt, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    {formatDate(domain.expiryDate, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {domain.owner.id}
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
