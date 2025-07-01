"use client";

import { EnsNode, useIndexingStatusQuery } from "@/components/ensnode";
import { globalIndexingStatusViewModel } from "@/components/indexing-status/view-models";
import { Registration } from "@/components/recent-registrations/types";
import {
  Duration,
  FormattedDate,
  NameDisplay,
  RelativeTime,
} from "@/components/recent-registrations/utils";
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
import {ENSNamespaceId, getEnsAppUrl} from "@ensnode/datasources";
import { Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Identity } from "../identity";
import { useRecentRegistrations } from "./hooks";

/**
 * Maximal number of latest registrations to be displayed in the panel
 */
const MAX_NUMBER_OF_LATEST_REGISTRATIONS = 5;

//TODO: improve description
/**
 * Main component of the 'Latest indexed registrations' panel
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
        indexingStatusQuery.data.runtime.networkIndexingStatusByChainId,
        indexingStatusQuery.data.env.NAMESPACE,
      ).currentIndexingDate
    : null;

  if (indexingStatusQuery.isLoading) {
    return <RegistrationsFallback />;
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
          {isClient && indexingStatusQuery.data && <RegistrationsList  ensNodeMetadata={indexingStatusQuery.data} ensNodeUrl={ensNodeUrl}/>}
      </CardContent>
    </Card>
  );
}

interface RegistrationsListProps {
    ensNodeUrl: URL
    ensNodeMetadata: EnsNode.Metadata;
}

//TODO: improve description
/**
 * Displays all registrations
 *
 * @param ensNodeMetadata data about connected ENSNode instance necessary for fetching registrations
 * @param ensNodeUrl URL of currently selected ENSNode instance
 */
function RegistrationsList({ensNodeMetadata, ensNodeUrl}: RegistrationsListProps){
    const namespaceId = ensNodeMetadata.env.NAMESPACE;

    const recentRegistrationsQuery = useRecentRegistrations(
        ensNodeUrl,
        MAX_NUMBER_OF_LATEST_REGISTRATIONS,
        namespaceId,
    );

    if (recentRegistrationsQuery.isLoading) {
        return <RegistrationsFallback />;
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
                        namespaceId={namespaceId}/>
                ))}
            </TableBody>
        </Table>
    );
}



interface RegistrationRowProps {
  registration: Registration;
  namespaceId: ENSNamespaceId;
}

//TODO: improve description
/**
 * Displays the data of a single registration
 */
function RegistrationRow({ registration, namespaceId }: RegistrationRowProps) {
  return (
    <TableRow>
      <TableCell>
        <NameDisplay
          namespaceId={namespaceId}
          name={registration.name}
          showExternalLink={true}
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

function RegistrationsFallback() {
  return (
    <div className="animate-pulse space-y-4">
        {[...Array(MAX_NUMBER_OF_LATEST_REGISTRATIONS)].map((_, idx) => <div key={`registrationFallback#${idx}`} className="h-10 bg-muted rounded w-full"></div>)}
    </div>
  );
}
