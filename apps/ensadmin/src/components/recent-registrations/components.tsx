import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Link } from "@tanstack/react-router";
import { Fragment } from "react";

import {
  type OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
  type OmnichainIndexingStatusSnapshotCompleted,
  type OmnichainIndexingStatusSnapshotFollowing,
  type RealtimeIndexingStatusProjection,
} from "@ensnode/ensnode-sdk";

import { ErrorInfo, type ErrorInfoProps } from "@/components/error-info";
import {
  RegistrationCard,
  RegistrationCardLoading,
} from "@/components/recent-registrations/registration-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";
import { formatOmnichainIndexingStatus } from "@/lib/indexing-status";

import { useRecentRegistrations } from "./hooks";

/**
 * Max number of recent registrations to display
 */
const DEFAULT_MAX_RECORDS = 25;

/**
 * Omnichain indexing statuses where ENSAdmin allows itself to query registrations.
 */
const SUPPORTED_OMNICHAIN_INDEXING_STATUSES: OmnichainIndexingStatusId[] = [
  OmnichainIndexingStatusIds.Following,
  OmnichainIndexingStatusIds.Completed,
];

export interface RecentRegistrationsOkProps {
  realtimeProjection: RealtimeIndexingStatusProjection | undefined;
  maxRecords?: number;
}

export interface RecentRegistrationsErrorProps {
  error: ErrorInfoProps;
}

/**
 * RecentRegistrations display variations:
 *
 * Standard -
 *      indexingStatus: {@link OmnichainIndexingStatusSnapshotCompleted} |
 *          {@link OmnichainIndexingStatusSnapshotFollowing},
 *
 * UnsupportedOmnichainIndexingStatusMessage -
 *      indexingStatus:  {@link OmnichainIndexingStatusSnapshot} other than
 *          {@link OmnichainIndexingStatusSnapshotCompleted} |
 *          {@link OmnichainIndexingStatusSnapshotFollowing},
 *
 * Loading -
 *      indexingStatus: undefined,
 *
 * Error -
 *      error: {@link ErrorInfoProps}
 */
export type RecentRegistrationsProps = RecentRegistrationsOkProps | RecentRegistrationsErrorProps;
/**
 * Displays a panel containing the list of the most recently indexed
 * registrations and the date of the most recently indexed block.
 *
 * Note: The Recent Registrations Panel is only visible when the
 * overall indexing status is either "completed", or "following".
 */
export function RecentRegistrations(props: RecentRegistrationsProps) {
  if ("error" in props) {
    return <ErrorInfo {...props.error} />;
  }

  const { realtimeProjection, maxRecords = DEFAULT_MAX_RECORDS } = props;

  if (realtimeProjection === undefined) {
    return <RecentRegistrationsLoading recordCount={maxRecords} />;
  }

  const { omnichainSnapshot } = realtimeProjection.snapshot;

  if (!SUPPORTED_OMNICHAIN_INDEXING_STATUSES.includes(omnichainSnapshot.omnichainStatus)) {
    return (
      <UnsupportedOmnichainIndexingStatusMessage
        omnichainIndexingStatus={omnichainSnapshot.omnichainStatus}
      />
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Latest indexed registrations</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RegistrationsList maxRecords={maxRecords} />
      </CardContent>
    </Card>
  );
}

interface RegistrationsListProps {
  maxRecords: number;
}

/**
 * Displays recently indexed registrations
 */
function RegistrationsList({ maxRecords }: RegistrationsListProps) {
  const recentRegistrationsQuery = useRecentRegistrations({
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
        <RegistrationCard key={registration.name} registration={registration} />
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
  omnichainIndexingStatus: OmnichainIndexingStatusId;
}

function UnsupportedOmnichainIndexingStatusMessage({
  omnichainIndexingStatus,
}: UnsupportedOmnichainIndexingStatusMessageProps) {
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();
  const supportedOmnichainIndexingStatuses = SUPPORTED_OMNICHAIN_INDEXING_STATUSES;

  return (
    <Card className="w-full">
      <CardHeader className="sm:pb-4 max-sm:p-3">
        <CardTitle>Please wait for indexing to advance</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-start items-start gap-4 sm:gap-3">
        <div className="flex flex-row flex-nowrap justify-start items-center gap-2">
          <p>Current omnichain indexing status:</p>
          <Badge
            className="uppercase text-xs leading-none"
            title={`Current omnichain indexing status: ${formatOmnichainIndexingStatus(
              omnichainIndexingStatus,
            )}`}
          >
            {formatOmnichainIndexingStatus(omnichainIndexingStatus)}
          </Badge>
        </div>
        <div>
          The latest indexed registrations will be available once the omnichain indexing status is{" "}
          {supportedOmnichainIndexingStatuses.map((supportedOmnichainIndexingStatus, idx) => (
            <Fragment key={supportedOmnichainIndexingStatus}>
              <Badge
                className="uppercase text-xs leading-none"
                title={`Supported overall omnichain indexing status: ${supportedOmnichainIndexingStatus}`}
              >
                {formatOmnichainIndexingStatus(supportedOmnichainIndexingStatus)}
              </Badge>
              {idx < supportedOmnichainIndexingStatuses.length - 1 && " or "}
            </Fragment>
          ))}
          .
        </div>
        <Button asChild variant="default">
          <Link to={retainCurrentRawConnectionUrlParam("/status")}>Check status</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
