"use client";

import type { ENSNamespaceId } from "@ensnode/datasources";
import {
  type ENSIndexerOverallIndexingCompletedStatus,
  type ENSIndexerOverallIndexingFollowingStatus,
  type ENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";
import { fromUnixTime, intlFormat } from "date-fns";
import { useEffect, useState } from "react";

import { Duration, RelativeTime, datetimeFormat } from "@/components/datetime-utils";
import { NameDisplay } from "@/components/identity/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock } from "lucide-react";
import { Identity } from "../identity";
import { useRecentRegistrations } from "./hooks";
import type { Registration } from "./types";

/**
 * Max number of latest registrations to display
 */
const MAX_NUMBER_OF_LATEST_REGISTRATIONS = 5;

interface RecentRegistrationsProps {
  ensIndexerConfig: ENSIndexerPublicConfig;

  indexingStatus:
    | ENSIndexerOverallIndexingCompletedStatus
    | ENSIndexerOverallIndexingFollowingStatus;
}

/**
 * Displays a panel containing the list of the most recently indexed
 * registrations and the date of the most recently indexed block.
 *
 * Note: The Recent Registrations Panel is only visible when the
 * overall indexing status is either "completed", or "following".
 */
export function RecentRegistrations({
  ensIndexerConfig,
  indexingStatus,
}: RecentRegistrationsProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { ensNodePublicUrl: ensNodeUrl, namespace: namespaceId } = ensIndexerConfig;

  const omnichainIndexingCursor = fromUnixTime(indexingStatus.omnichainIndexingCursor);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Latest indexed registrations</span>

          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-blue-600" />
            <span className="text-sm font-medium">{datetimeFormat(omnichainIndexingCursor)}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isClient && (
          <RecentRegistrationsList
            ensNodeUrl={ensNodeUrl}
            namespaceId={namespaceId}
            maxRecords={MAX_NUMBER_OF_LATEST_REGISTRATIONS}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface RecentRegistrationsListProps {
  ensNodeUrl: URL;
  namespaceId: ENSNamespaceId;
  maxRecords: number;
}

/**
 * Displays recently indexed registrations as a table
 *
 * @param ensNodeMetadata data about connected ENSNode instance necessary for fetching registrations
 * @param ensNodeUrl URL of currently selected ENSNode instance
 */
function RecentRegistrationsList({
  ensNodeUrl,
  namespaceId,
  maxRecords,
}: RecentRegistrationsListProps) {
  const recentRegistrationsQuery = useRecentRegistrations({
    ensNodeUrl,
    namespaceId,
    maxRecords,
  });

  if (recentRegistrationsQuery.isLoading) {
    return <RegistrationsListLoading rowCount={maxRecords} />;
  }

  if (recentRegistrationsQuery.isError) {
    return (
      <p>
        Could not fetch recent registrations due to an error:{" "}
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
        <NameDisplay
          name={registration.name}
          namespaceId={namespaceId}
          showExternalLinkIcon={true}
        />
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

interface RegistrationsListLoadingProps {
  rowCount: number;
}
function RegistrationsListLoading({ rowCount }: RegistrationsListLoadingProps) {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(rowCount)].map((_, idx) => (
        <div key={`registrationListLoading#${idx}`} className="h-10 bg-muted rounded w-full"></div>
      ))}
    </div>
  );
}
