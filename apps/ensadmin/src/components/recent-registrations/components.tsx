"use client";

import type { ENSNamespaceId } from "@ensnode/datasources";
import {
  ENSIndexerOverallIndexingStatus,
  type ENSIndexerPublicConfig,
  OverallIndexingStatusIds,
} from "@ensnode/ensnode-sdk";
import { fromUnixTime } from "date-fns";
import { useEffect, useState } from "react";

import { Duration, RelativeTime } from "@/components/datetime-utils";
import { ErrorInfo, ErrorInfoProps } from "@/components/error-info";
import { NameDisplay, NameLink } from "@/components/identity/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";
import Link from "next/link";
import { Identity } from "../identity";
import { useRecentRegistrations } from "./hooks";
import type { Registration } from "./types";

/**
 * Max number of latest registrations to display
 */
const MAX_NUMBER_OF_LATEST_REGISTRATIONS = 25;

/**
 * RecentRegistrations display variations:
 *
 * Standard -
 *      ensIndexerConfig: ENSIndexerPublicConfig,
 *      indexingStatus: ENSIndexerOverallIndexingCompletedStatus |
 *          ENSIndexerOverallIndexingFollowingStatus ,
 *      error: undefined
 *
 * RegistrationsNotAvailableMessage -
 *      ensIndexerConfig: ENSIndexerPublicConfig,
 *      indexingStatus: statuses different from Following & Completed,
 *      error: undefined
 *
 * Loading -
 *      ensIndexerConfig: undefined,
 *      indexingStatus: undefined,
 *      error: undefined
 *
 * Error (including ENSIndexerOverallIndexingErrorStatus response)-
 *      ensIndexerConfig: undefined,
 *      indexingStatus: undefined,
 *      error: ErrorInfoProps
 *
 * @throws If both error and any from the pair of ensIndexerConfig & indexingStatus are defined
 */
export interface RecentRegistrationsProps {
  ensIndexerConfig?: ENSIndexerPublicConfig;
  indexingStatus?: ENSIndexerOverallIndexingStatus;
  error?: ErrorInfoProps;
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
  error,
}: RecentRegistrationsProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (error !== undefined && (ensIndexerConfig !== undefined || indexingStatus !== undefined)) {
    throw new Error("Invariant: RecentRegistrations with both indexer data and error defined.");
  }

  if (error !== undefined) {
    return <ErrorInfo {...error} />;
  }

  if (ensIndexerConfig === undefined || indexingStatus === undefined) {
    return <RecentRegistrationsLoading rowCount={MAX_NUMBER_OF_LATEST_REGISTRATIONS} />;
  }

  //TODO: Not sure if we need a separate case for indexer-error
  // since it's displayed by the indexing status. Advice appreciated
  if (
    indexingStatus.overallStatus !== OverallIndexingStatusIds.Completed &&
    indexingStatus.overallStatus !== OverallIndexingStatusIds.Following
  ) {
    return <RegistrationsNotAvailableMessage />;
  }

  const { ensNodePublicUrl: ensNodeUrl, namespace: namespaceId } = ensIndexerConfig;

  // Get the current indexing date from the indexing status
  const currentIndexingDate =
    indexingStatus.overallStatus === OverallIndexingStatusIds.Following
      ? fromUnixTime(indexingStatus.omnichainIndexingCursor)
      : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Latest indexed registrations</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isClient && (
          <RegistrationsList
            ensNodeUrl={ensNodeUrl}
            namespaceId={namespaceId}
            maxRecords={MAX_NUMBER_OF_LATEST_REGISTRATIONS}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface RegistrationsListProps {
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
function RegistrationsList({ ensNodeUrl, namespaceId, maxRecords }: RegistrationsListProps) {
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
        <TableRow className="hover:bg-white">
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
        <NameLink
          name={registration.name}
          className="inline-flex items-center gap-2 text-blue-600 hover:underline"
        >
          <NameDisplay name={registration.name} />
        </NameLink>
      </TableCell>
      <TableCell>
        <RelativeTime timestamp={registration.registeredAt} tooltipPosition="top" />
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
  rowCount: number;
}
function RegistrationsListLoading({ rowCount }: RegistrationLoadingProps) {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(rowCount)].map((_, idx) => (
        <div key={`registrationListLoading#${idx}`} className="h-10 bg-muted rounded w-full"></div>
      ))}
    </div>
  );
}

function RecentRegistrationsLoading({ rowCount }: RegistrationLoadingProps) {
  return (
    <Card>
      <CardHeader className="max-sm:p-3">
        <div className="h-6 bg-muted rounded w-1/4" />
      </CardHeader>
      <CardContent className="max-sm:p-3 max-sm:pt-0">
        <RegistrationsListLoading rowCount={rowCount} />
      </CardContent>
    </Card>
  );
}

function RegistrationsNotAvailableMessage() {
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();
  const monitorStatusMessage = "Check current indexing status";

  return (
    <Card className="w-full">
      <CardHeader className="sm:pb-4 max-sm:p-3">
        <CardTitle>Latest indexed registrations are not available</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-start items-start gap-4 sm:gap-3">
        <p>
          The latest indexed registrations will be available once the indexing status is{" "}
          <span className="font-mono bg-muted p-1 rounded-md">Following</span> or{" "}
          <span className="font-mono bg-muted p-1 rounded-md">Completed</span>.
        </p>
        <Button asChild variant="default">
          <Link href={retainCurrentRawConnectionUrlParam("/status")}>{monitorStatusMessage}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
