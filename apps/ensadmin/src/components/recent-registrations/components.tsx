"use client";

import { ErrorInfo, ErrorInfoProps } from "@/components/error-info";
import {
  RegistrationCard,
  RegistrationCardLoading,
} from "@/components/recent-registrations/registration-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveConnection } from "@/hooks/active/use-active-connection";
import { useSelectedConnection } from "@/hooks/active/use-selected-connection";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";
import { cn } from "@/lib/utils";
import type { ENSNamespaceId } from "@ensnode/datasources";
import {
  ENSIndexerOverallIndexingStatus,
  type ENSIndexerPublicConfig,
  OverallIndexingStatusId,
  OverallIndexingStatusIds,
} from "@ensnode/ensnode-sdk";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRecentRegistrations } from "./hooks";

/**
 * Max number of latest registrations to display
 */
const DEFAULT_MAX_RECORDS = 25;

/**
 * Omnichain indexing statuses where ENSAdmin allows itself to query registrations.
 */
const SUPPORTED_OMNICHAIN_INDEXING_STATUSES: OverallIndexingStatusId[] = [
  OverallIndexingStatusIds.Following,
  OverallIndexingStatusIds.Completed,
  OverallIndexingStatusIds.IndexerError,
];

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
  maxRecords?: number;
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
  maxRecords = DEFAULT_MAX_RECORDS,
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
    return <RecentRegistrationsLoading recordCount={maxRecords} />;
  }

  if (!SUPPORTED_OMNICHAIN_INDEXING_STATUSES.includes(indexingStatus.overallStatus)) {
    return (
      <UnsupportedOmnichainIndexingStatusMessage
        overallOmnichainIndexingStatus={indexingStatus.overallStatus}
      />
    );
  }

  const { namespace: namespaceId } = ensIndexerConfig;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Latest indexed registrations</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isClient && <RegistrationsList namespaceId={namespaceId} maxRecords={maxRecords} />}
      </CardContent>
    </Card>
  );
}

interface RegistrationsListProps {
  namespaceId: ENSNamespaceId;
  maxRecords: number;
}

/**
 * Displays recently indexed registrations as a table
 *
 * @param ensNodeMetadata data about connected ENSNode instance necessary for fetching registrations
 * @param ensNodeUrl URL of currently selected ENSNode instance
 */
function RegistrationsList({ namespaceId, maxRecords }: RegistrationsListProps) {
  const { rawSelectedConnection } = useSelectedConnection();
  const ensNodeUrl = useMemo(() => new URL(rawSelectedConnection), [rawSelectedConnection]);
  const recentRegistrationsQuery = useRecentRegistrations({
    ensNodeUrl,
    namespaceId,
    maxRecords,
  });

  const [animationParent] = useAutoAnimate();

  if (recentRegistrationsQuery.isLoading) {
    return <RegistrationsListLoading recordCount={maxRecords} />;
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
    <div
      ref={animationParent}
      className="w-full h-fit box-border flex flex-col justify-start items-center gap-3"
    >
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
  recordCount: number;
}
function RegistrationsListLoading({ recordCount }: RegistrationLoadingProps) {
  return (
    <div className="space-y-4">
      {[...Array(recordCount)].map((_, idx) => (
        <RegistrationCardLoading key={`registrationListLoading#${idx}`} />
      ))}
    </div>
  );
}

function RecentRegistrationsLoading({ recordCount }: RegistrationLoadingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Latest indexed registrations</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-sm:p-3 max-sm:pt-0">
        <RegistrationsListLoading recordCount={recordCount} />
      </CardContent>
    </Card>
  );
}

interface UnsupportedOmnichainIndexingStatusMessageProps {
  overallOmnichainIndexingStatus: OverallIndexingStatusId;
}

function UnsupportedOmnichainIndexingStatusMessage({
  overallOmnichainIndexingStatus,
}: UnsupportedOmnichainIndexingStatusMessageProps) {
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();
  // We don't want the user-facing list of supported statuses to include "Indexer Error".
  // That's technically true, but it's very confusing UX.
  // Therefore, the list in the message should just show "Following" and "Completed" statuses.
  const filteredSupportedOmnichainIndexingStatuses = SUPPORTED_OMNICHAIN_INDEXING_STATUSES.filter(
    (omnichainIndexingStatus) => omnichainIndexingStatus !== OverallIndexingStatusIds.IndexerError,
  );

  return (
    <Card className="w-full">
      <CardHeader className="sm:pb-4 max-sm:p-3">
        <CardTitle>Please wait for indexing to advance</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-start items-start gap-4 sm:gap-3">
        <div className="flex flex-row flex-nowrap justify-start items-center gap-2">
          <p>Current overall omnichain indexing status:</p>
          <Badge
            className="uppercase text-xs leading-none"
            title={`Current overall omnichain indexing status: ${overallOmnichainIndexingStatus}`}
          >
            {overallOmnichainIndexingStatus}
          </Badge>
        </div>
        <div>
          The latest indexed registrations will be available once the omnichain indexing status is{" "}
          {filteredSupportedOmnichainIndexingStatuses.map(
            (supportedOmnichainIndexingStatus, idx) => (
              <React.Fragment key={supportedOmnichainIndexingStatus}>
                <Badge
                  className="uppercase text-xs leading-none"
                  title={`Supported overall omnichain indexing status: ${supportedOmnichainIndexingStatus}`}
                >
                  {supportedOmnichainIndexingStatus}
                </Badge>
                {idx < filteredSupportedOmnichainIndexingStatuses.length - 1 && " or "}
              </React.Fragment>
            ),
          )}
          .
        </div>
        <Button asChild variant="default">
          <Link href={retainCurrentRawConnectionUrlParam("/status")}>Check status</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
