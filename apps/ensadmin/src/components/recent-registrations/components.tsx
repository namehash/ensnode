"use client";

import {
  DatasourceNames,
  type ENSNamespaceId,
  getENSRootChainId,
  maybeGetDatasource,
} from "@ensnode/datasources";
import {
  ChainId,
  type ENSIndexerOverallIndexingCompletedStatus,
  type ENSIndexerOverallIndexingFollowingStatus,
  type ENSIndexerPublicConfig,
  Name,
  OverallIndexingStatusIds,
} from "@ensnode/ensnode-sdk";
import { fromUnixTime } from "date-fns";
import { useEffect, useState } from "react";

import { Duration, RelativeTime } from "@/components/datetime-utils";
import { NameDisplay, NameLink } from "@/components/identity/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
 * NOTE: This function is a "dirty-hack".
 *
 * TODO: Update our indexed data model for registrations so that this dirty hack
 *       is no longer needed.
 */
const guessChainIdFromRegisteredName = (name: Name, namespaceId: ENSNamespaceId): ChainId => {
  const labels = name.split(".");

  if (labels.length === 3) {
    if (name.endsWith(".base.eth")) {
      // name is a direct subname of .base.eth
      // we will therefore assume it occured within Basenames.
      // NOTE: this assumption is not necessarily true, nothing technically stops
      // subnames of base.eth from occurring on the ENS root chain. And some have.
      // Therefore, this is only a "dirty-hack" approximation.
      const basenames = maybeGetDatasource(namespaceId, DatasourceNames.Basenames);

      if (basenames) return basenames.chain.id;

      // basenames is undefined for the namespace, therefore fallback
      // to the ENS root chain
    } else if (name.endsWith(".linea.eth")) {
      // name is a direct subname of .linea.eth
      // we will therefore assume it occured within Lineanames.
      // NOTE: this assumption is not necessarily true, nothing technically stops
      // subnames of linea.eth from occurring on the ENS root chain. And some have.
      // Therefore, this is only a "dirty-hack" approximation.
      const linea = maybeGetDatasource(namespaceId, DatasourceNames.Lineanames);

      if (linea) return linea.chain.id;

      // basenames is undefined for the namespace, therefore fallback
      // to the ENS root chain
    }
  }

  // fallback to assuming the the registration occurred on the ENS root chain
  return getENSRootChainId(namespaceId);
};

/**
 * Displays the data of a single Registration within a row
 */
function RegistrationRow({ registration, namespaceId }: RegistrationRowProps) {
  const chainIdGuess = guessChainIdFromRegisteredName(registration.name, namespaceId);
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
        <Identity
          address={registration.owner}
          namespaceId={namespaceId}
          showAvatar={true}
          chainId={chainIdGuess}
        />
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
