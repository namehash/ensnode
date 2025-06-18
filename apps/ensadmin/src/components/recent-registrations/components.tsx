"use client";

import { useIndexedChainId, useIndexingStatusQuery } from "@/components/ensnode";
import { globalIndexingStatusViewModel } from "@/components/indexing-status/view-models";
import { Duration, FormattedDate, RelativeTime } from "@/components/recent-registrations/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, ExternalLink } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Identity } from "../identity";
import { useRecentRegistrations } from "./hooks";

/**
 * Number of latest registrations to be displayed in the panel
 */
const NUMBER_OF_LATEST_REGISTRATIONS = 5;

/**
 * Helper function to generate ENS app URL for a name
 */
const getEnsAppUrlForName = (name: string) => {
    // no explicit url encoding needed
  return `https://app.ens.domains/${name}`;
};

export function RecentRegistrations() {
  const searchParams = useSearchParams();
  const recentRegistrationsQuery = useRecentRegistrations(
    searchParams,
    NUMBER_OF_LATEST_REGISTRATIONS,
  );
  const indexingStatus = useIndexingStatusQuery(searchParams);
  const indexedChainId = useIndexedChainId(indexingStatus.data);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get the current indexing date from the indexing status
  const currentIndexingDate = indexingStatus.data
    ? globalIndexingStatusViewModel(
        indexingStatus.data.runtime.networkIndexingStatusByChainId,
        indexingStatus.data.env.ENS_DEPLOYMENT_CHAIN,
      ).currentIndexingDate
    : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Latest indexed registrations</span>
          {currentIndexingDate && (
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-blue-600" />
              <span className="text-sm font-medium">
                Last indexed block on{" "}
                <FormattedDate
                  date={currentIndexingDate}
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
        {recentRegistrationsQuery.isLoading ? (
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
                recentRegistrationsQuery.data?.map((registration) => (
                  <TableRow key={registration.name}>
                    <TableCell className="font-medium">
                      <a
                        href={getEnsAppUrlForName(registration.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        {registration.name}
                        <ExternalLink size={14} className="inline-block" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <RelativeTime date={registration.registeredAt} />
                    </TableCell>
                    <TableCell>
                      <Duration
                        beginsAt={registration.registeredAt}
                        endsAt={registration.expiresAt}
                      />
                    </TableCell>
                    <TableCell>
                      {indexedChainId ? (
                        <Identity
                          address={registration.owner}
                          chainId={indexedChainId}
                          showAvatar={true}
                        />
                      ) : (
                        <Identity.Placeholder showAvatar={true} />
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
