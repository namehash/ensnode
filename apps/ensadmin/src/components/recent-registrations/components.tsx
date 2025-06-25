"use client";

import {EnsNode, useENSRootDatasourceChainId, useIndexingStatusQuery} from "@/components/ensnode";
import { getEnsAppUrl, getEnsMetadataUrl } from "@/components/identity/utils";
import { globalIndexingStatusViewModel } from "@/components/indexing-status/view-models";
import {
  Duration,
  FormattedDate,
  RegistrationNameDisplay,
  RelativeTime,
  getNameWrapperAddress,
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
import {Registration} from "@/components/recent-registrations/types";
import {SupportedChainId} from "@/lib/wagmi";
import {useEnsName} from "wagmi";

/**
 * Maximal number of latest registrations to be displayed in the panel
 */
const MAX_NUMBER_OF_LATEST_REGISTRATIONS = 5;

export function RecentRegistrations() {
  const searchParams = useSearchParams();
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);
  const indexingStatusQuery = useIndexingStatusQuery(ensNodeUrl);
  const indexedChainId = indexingStatusQuery.data ? useENSRootDatasourceChainId(indexingStatusQuery.data) : undefined;

  const nameWrapperAddress =
        indexingStatusQuery.data && indexedChainId
            ? getNameWrapperAddress(indexingStatusQuery.data.env.NAMESPACE, indexedChainId)
            : null;
    //TODO: this should be moved --> placing it here requires loads of prop drilling! But otherwise, do we want to use a useQuery inside another Query? I very much doubt so
    // Are there any alternatives? Maybe we could input the ENSNode.Metadata as a whole? Then we would get the nameWrapper at the very end where we actually need it?

  const recentRegistrationsQuery = useRecentRegistrations(
    ensNodeUrl,
    MAX_NUMBER_OF_LATEST_REGISTRATIONS,
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
              {isClient &&
                recentRegistrationsQuery.data?.map((registration) => (
                  <RegistrationRow key={registration.name} registration={registration} ensNodeMetadata={indexingStatusQuery.data} rootDatasourceChainId={indexedChainId}/>
                ))}
            </TableBody>
          </Table>
      </CardContent>
    </Card>
  );
}

interface RegistrationRowProps {
    registration: Registration;
    ensNodeMetadata: EnsNode.Metadata;
    rootDatasourceChainId: SupportedChainId | undefined;  //TODO: We need to be more precise here. We shouldn't be passing in any possible supported chain Id (for example, we "support" optimism, base, etc..).
    // Instead, more specifically this should be the ENS Deployment Chain Id for the connected ENSNode instance.
}

function RegistrationRow({registration, ensNodeMetadata, rootDatasourceChainId}: RegistrationRowProps){
    const namespaceId = ensNodeMetadata.env.NAMESPACE;

    //TODO: establish the level where we would handle undefined results (ens-test-env for both + holesky for metadata)!!!
    const ensAppUrl = getEnsAppUrl(namespaceId);
    const ensMetadataUrl = getEnsMetadataUrl(namespaceId);

    //TODO: if the ENS deployment chain is the ens-test-env, we should not make use of the useEnsName hook at all and instead just always show the truncated address and not look up the primary name.
    // Maybe this could be joined with handling issues  mentioned above?
    // We should document that we'll need to come back to this later after introducing a mechanism for ENSNode to optionally pass an RPC endpoint ENSAdmin for it to make lookups such as this.

    return (
        <TableRow>
            <TableCell className="font-medium">
                <RegistrationNameDisplay registration={registration} ensAppUrl={ensAppUrl} />
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
                {/*//TODO: for now we handle the issue described above here by not calling on the <Identity /> component if any of the elements is undefined*/}
                {ensMetadataUrl && ensAppUrl && rootDatasourceChainId ? (
                    <Identity
                        address={registration.owner}
                        ens={{
                            appBaseUrl: ensAppUrl,
                            metadataBaseUrl: ensMetadataUrl,
                            nameQuery: useEnsName({
                                address: registration.owner,
                                chainId: rootDatasourceChainId,
                            })
                        }}
                        showAvatar={true}
                    />
                ) : (
                    <Identity.Placeholder showAvatar={true} />
                )}
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
