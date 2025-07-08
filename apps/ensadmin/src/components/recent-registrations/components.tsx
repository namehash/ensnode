"use client";

import { EnsNode, useIndexingStatusQuery } from "@/components/ensnode";
import { NameDisplay } from "@/components/identity/utils";
import { globalIndexingStatusViewModel } from "@/components/indexing-status/view-models";
import { Registration } from "@/components/recent-registrations/types";
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
import { selectedEnsNodeUrl } from "@/lib/env";
import { ENSNamespaceId } from "@ensnode/datasources";
import { Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Identity } from "../identity";
import { useRecentRegistrations } from "./hooks";

/**
 * Maximal number of latest registrations to be displayed in the panel
 */
const MAX_NUMBER_OF_LATEST_REGISTRATIONS = 5;

/**
 * Displays a list of the most recently indexed registrations and the date of the most recently indexed block
 */
export function RecentRegistrations() {
  const searchParams = useSearchParams();
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);
  const indexingStatusQuery = useIndexingStatusQuery(ensNodeUrl);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get the current indexing date from the indexing status
  const currentIndexingDate = indexingStatusQuery.data
    ? globalIndexingStatusViewModel(
        indexingStatus.data.runtime.chainIndexingStatuses,
        indexingStatus.data.env.NAMESPACE,
      ).currentIndexingDate
    : null;

  if (indexingStatusQuery.isLoading) {
    return <RegistrationsListLoading rowCount={MAX_NUMBER_OF_LATEST_REGISTRATIONS} />;
  }

  if (indexingStatusQuery.isError) {
    return (
      <p>
        Could not fetch indexing status from selected ENSNode due to an error: $
        {indexingStatusQuery.error.message}
      </p>
    );
  }

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
        {isClient && indexingStatusQuery.data && (
          <RegistrationsList
            ensNodeMetadata={indexingStatusQuery.data}
            ensNodeUrl={ensNodeUrl}
            maxRecords={MAX_NUMBER_OF_LATEST_REGISTRATIONS}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface RegistrationsListProps {
  ensNodeUrl: URL;
  ensNodeMetadata: EnsNode.Metadata;
  maxRecords: number;
}

/**
 * Displays recently indexed registrations as a table
 *
 * @param ensNodeMetadata data about connected ENSNode instance necessary for fetching registrations
 * @param ensNodeUrl URL of currently selected ENSNode instance
 */
function RegistrationsList({
  ensNodeMetadata,
  ensNodeUrl,
  maxRecords,
}: RegistrationsListProps) {
  const namespaceId = ensNodeMetadata.env.NAMESPACE;

  const recentRegistrationsQuery = useRecentRegistrations(
    ensNodeUrl,
    maxRecords,
    namespaceId,
  );

  if (recentRegistrationsQuery.isLoading) {
    return <RegistrationsListLoading rowCount={maxRecords} />;
  }

  if (recentRegistrationsQuery.isError) {
    return (
      <p>
        Could not fetch recent registrations due to an error: $
        {recentRegistrationsQuery.error.message}
      </p>
    );
  }

  return (
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
        {recentRegistrationsQuery.data?.map((registration) => (
          <RegistrationRow
            key={registration.name}
            registration={registration}
            namespaceId={namespaceId}
          />
        ))}
      </TableBody>
    </Table>
  );
}

interface RegistrationRowProps {
  registration: Registration;
  namespaceId: ENSNamespaceId;
}

/**
 * Displays the data of a single Registration within a row
 */
function RegistrationRow({ registration, namespaceId }: RegistrationRowProps) {
  return (
    <TableRow>
      <TableCell>
        <NameDisplay name={registration.name} namespaceId={namespaceId} showExternalLink={true} />
      </TableCell>
      <TableCell>
        <RelativeTime date={registration.registeredAt} />
      </TableCell>
      <TableCell>
        <Duration beginsAt={registration.registeredAt} endsAt={registration.expiresAt} />
      </TableCell>
      <TableCell>
        <Identity address={registration.owner} namespaceId={namespaceId} showAvatar={true} />
      </TableCell>
    </TableRow>
  );
}

interface RegistrationLoadingProps {
    rowCount: number
}
function RegistrationsListLoading({rowCount}: RegistrationLoadingProps) {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(rowCount)].map((_, idx) => (
        <div key={`registrationListLoading#${idx}`} className="h-10 bg-muted rounded w-full"></div>
      ))}
    </div>
  );
}
