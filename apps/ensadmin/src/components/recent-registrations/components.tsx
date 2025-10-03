"use client";

import type { ENSNamespaceId } from "@ensnode/datasources";
import {
    ENSIndexerOverallIndexingStatus,
    type ENSIndexerPublicConfig, OverallIndexingStatusId,
    OverallIndexingStatusIds,
} from "@ensnode/ensnode-sdk";
import { useEffect, useState } from "react";
import { ErrorInfo, ErrorInfoProps } from "@/components/error-info";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";
import Link from "next/link";
import { useRecentRegistrations } from "./hooks";
import {Badge} from "@/components/ui/badge";
import {cn} from "@/lib/utils";
import {RegistrationCard} from "@/components/recent-registrations/registration-card";

/**
 * Max number of latest registrations to display
 */
const DEFAULT_MAX_ROWS = 25;

/**
 * Omnichain indexing statuses that allow the display of registrations.
 */
const SUPPORTED_OMNICHAIN_INDEXING_STATUSES: OverallIndexingStatusId[] = [OverallIndexingStatusIds.Following, OverallIndexingStatusIds.Completed]

/**
 * RecentRegistrations display variations:
 *
 * Standard -
 *      ensIndexerConfig: ENSIndexerPublicConfig,
 *      indexingStatus: ENSIndexerOverallIndexingCompletedStatus |
 *          ENSIndexerOverallIndexingFollowingStatus ,
 *      error: undefined
 *
 * UnsupportedOmnichainIndexingStatusMessage -
 *      ensIndexerConfig: ENSIndexerPublicConfig,
 *      indexingStatus: statuses different from Following & Completed,
 *      error: undefined
 *
 * Loading -
 *      ensIndexerConfig: undefined,
 *      indexingStatus: undefined,
 *      error: undefined
 *
 * Error -
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
  maxRows?: number;
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
  maxRows = DEFAULT_MAX_ROWS,
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
    return <RecentRegistrationsLoading rowCount={maxRows} />;
  }

  if (!SUPPORTED_OMNICHAIN_INDEXING_STATUSES.includes(indexingStatus.overallStatus)) {
    return <UnsupportedOmnichainIndexingStatusMessage overallOmnichainIndexingStatus={indexingStatus.overallStatus} />;
  }

  const { ensNodePublicUrl: ensNodeUrl, namespace: namespaceId } = ensIndexerConfig;

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
            maxRecords={maxRows}
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
          <div className="w-full h-fit box-border flex flex-col justify-start items-center gap-3">
              {recentRegistrationsQuery.data?.map((registration) => (
                  <RegistrationCard
                      key={registration.name}
                      registration={registration}
                      namespaceId={namespaceId}
                  />
              ))}
          </div>
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
        <CardHeader>
            <CardTitle className="flex justify-between items-center">
                <span>Latest indexed registrations</span>
            </CardTitle>
        </CardHeader>
      <CardContent className="max-sm:p-3 max-sm:pt-0">
        <RegistrationsListLoading rowCount={rowCount} />
      </CardContent>
    </Card>
  );
}

interface UnsupportedOmnichainIndexingStatusMessageProps {
    overallOmnichainIndexingStatus: OverallIndexingStatusId;
}

function UnsupportedOmnichainIndexingStatusMessage({overallOmnichainIndexingStatus} : UnsupportedOmnichainIndexingStatusMessageProps) {
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();

  return (
    <Card className="w-full">
      <CardHeader className="sm:pb-4 max-sm:p-3">
          {/*TODO: the wording for the indexer-error is awkward, advice appreciated*/}
        <CardTitle>{overallOmnichainIndexingStatus === OverallIndexingStatusIds.IndexerError ? "Please investigate your ENSNode instance" : "Please wait for indexing to advance"}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-start items-start gap-4 sm:gap-3">
          <div className="flex flex-row flex-nowrap justify-start items-center gap-2">
              <p>Current overall omnichain indexing status:</p>
              <Badge
                  className={cn(
                      "uppercase text-xs leading-none",
                      overallOmnichainIndexingStatus === OverallIndexingStatusIds.IndexerError && "bg-red-600 text-white",
                  )}
                  title={`Current overall omnichain indexing status: ${overallOmnichainIndexingStatus}`}
              >
                  {overallOmnichainIndexingStatus === OverallIndexingStatusIds.IndexerError
                      ? "Indexer Error"
                      : overallOmnichainIndexingStatus}
              </Badge>
          </div>
          {overallOmnichainIndexingStatus === OverallIndexingStatusIds.IndexerError ?
              <p> It appears that the indexing of new blocks has been interrupted. API requests to this ENSNode
                  should continue working successfully but may serve data that isn't updated to the latest
                  onchain state.</p> : <p>
                  The latest indexed registrations will be available once the omnichain indexing status is{" "}
                  {SUPPORTED_OMNICHAIN_INDEXING_STATUSES.map((supportedOmnichainIndexingStatus, idx) =>
                      <>
                          <span className="font-mono bg-muted p-1 rounded-md">{supportedOmnichainIndexingStatus}</span>
                          {idx < SUPPORTED_OMNICHAIN_INDEXING_STATUSES.length - 1 && " or "}
                      </>
                  )}.
              </p>}
          <Button asChild variant="default">
              <Link href={retainCurrentRawConnectionUrlParam("/status")}>Check status</Link>
          </Button>
      </CardContent>
    </Card>
  );
}
