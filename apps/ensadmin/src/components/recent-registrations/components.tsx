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
import { Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Identity } from "../identity";
import { useRecentRegistrations } from "./hooks";
import {getEnsAppUrl} from "@ensnode/datasources";

/**
 * Maximal number of latest registrations to be displayed in the panel
 */
const MAX_NUMBER_OF_LATEST_REGISTRATIONS = 5;

export function RecentRegistrations() {
  const searchParams = useSearchParams();
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);
  const indexingStatusQuery = useIndexingStatusQuery(ensNodeUrl);

  // TODO: Also where should we handle that in case of indexingStatusQuery failure this would result in an error -> in no other scenario the namespaceId should be a null value
  //  Can we assume that if such thing occurs either a fallback or the error message higher up will be called?
  //  Or should we perform a validation similar to the view-model below?
    //TODO: because of the need for the namespaceId inside recent registrations hook, it becomes dependent on the useIndexingStatus query which is bad
  const namespaceId = indexingStatusQuery.data ? indexingStatusQuery.data.env.NAMESPACE : null;

  const recentRegistrationsQuery = useRecentRegistrations(
    ensNodeUrl,
    MAX_NUMBER_OF_LATEST_REGISTRATIONS,
    namespaceId,
  );

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

  if (indexingStatusQuery.isLoading || recentRegistrationsQuery.isLoading) {
    return <RecentRegistrationsFallback />;
  }

  //TODO: This approach is a little bit trade-offish - cause we make JSX simpler but have to additionally make sure query's results are not undefined in the final return JSX
  if (indexingStatusQuery.isError) {
    return (
      <p>
        Could not fetch indexing status from selected ENSNode due to an error: $
        {indexingStatusQuery.error.message}
      </p>
    );
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
            {isClient && indexingStatusQuery.data &&
              recentRegistrationsQuery.data?.map((registration) => (
                <RegistrationRow
                  key={registration.name}
                  registration={registration}
                  ensNodeMetadata={indexingStatusQuery.data}
                />
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface RegistrationRowProps {
  registration: Registration;
  ensNodeMetadata: EnsNode.Metadata; //TODO: maybe we could just inject only namespaceId here? Not 100% sure which option is better, but I like the current one more cause it seems cleaner, less over-engineered, (more invariants friendly?)
}

function RegistrationRow({
  registration,
  ensNodeMetadata,
}: RegistrationRowProps) {
  const namespaceId = ensNodeMetadata.env.NAMESPACE;

  return (
    <TableRow>
      <TableCell>
        <NameDisplay namespaceId={namespaceId} ensName={registration.name} showExternalLink={true}/>
      </TableCell>
      <TableCell>
        <RelativeTime date={registration.registeredAt} />
      </TableCell>
      <TableCell>
        <Duration beginsAt={registration.registeredAt} endsAt={registration.expiresAt} />
      </TableCell>
      <TableCell>
          <Identity
            address={registration.owner}
            ensNamespaceId={namespaceId}
            showAvatar={true}
          />
      </TableCell>
    </TableRow>
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
