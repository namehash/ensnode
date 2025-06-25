"use client";

import { useENSRootDatasourceChainId, useIndexingStatusQuery } from "@/components/ensnode";
import { globalIndexingStatusViewModel } from "@/components/indexing-status/view-models";
import {
    Duration,
    FormattedDate,
    getNameWrapperAddress,
    RegistrationNameDisplay,
    RelativeTime
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
import { Clock, ExternalLink } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Identity } from "../identity";
import { useRecentRegistrations } from "./hooks";
import {getEnsAppUrl, getEnsMetadataUrl} from "@/components/identity/utils";

/**
 * Maximal number of latest registrations to be displayed in the panel
 */
const MAX_NUMBER_OF_LATEST_REGISTRATIONS = 5;

/**
 * Helper function to generate ENS app URL for a name
 */
const getEnsAppUrlForName = (name: string) => {
    // no explicit url encoding needed
    return `https://app.ens.domains/${name}`;
};

export function RecentRegistrations() {
    const searchParams = useSearchParams();
    const recentRegistrationsQuery = useRecentRegistrations(
        selectedEnsNodeUrl(searchParams),
        MAX_NUMBER_OF_LATEST_REGISTRATIONS,
    );
    const indexingStatus = useIndexingStatusQuery(searchParams);
    const indexedChainId = useENSRootDatasourceChainId(indexingStatus.data);
    const namespaceId = indexingStatus.data ? indexingStatus.data.env.NAMESPACE : null; //TODO: decide on how to handle possible undefined data. Should all be handled individually like <currentIndexingDate>? Or maybe it could all be handled in a unified way?
    const [isClient, setIsClient] = useState(false);

    // console.log("test", indexingStatus);

    //TODO: establish the level where we would handle undefined results!!!
    const ensAppUrl = getEnsAppUrl(namespaceId!);
    const ensMetadataUrl = getEnsMetadataUrl(namespaceId!);

    const nameWrapperAddress = indexingStatus.data && indexedChainId ? getNameWrapperAddress(indexingStatus.data.env.NAMESPACE, indexedChainId) : null;
    //TODO: this might be moved --> placing it here requires loads of prop drilling! But otherwise, do we want to use a useQuery inside another Query? I very much doubt so

    console.log("NW address", nameWrapperAddress);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Get the current indexing date from the indexing status
    const currentIndexingDate = indexingStatus.data
        ? globalIndexingStatusViewModel(
            indexingStatus.data.runtime.networkIndexingStatusByChainId,
            indexingStatus.data.env.NAMESPACE,
        ).currentIndexingDate
        : null;

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
                {recentRegistrationsQuery.isLoading ? (
                    <RecentRegistrationsFallback />
                ) : recentRegistrationsQuery.error ? (
                    <div className="text-destructive">
                        Error loading recent registrations: {(recentRegistrationsQuery.error as Error).message}
                    </div>
                ) : (
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
                                    <TableRow key={registration.name}>
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
                                            {indexedChainId ? (
                                                <Identity
                                                    address={registration.owner}
                                                    chainId={indexedChainId}
                                                    ens={{
                                                        appBaseUrl: ensAppUrl,
                                                        metadataBaseUrl: ensMetadataUrl,
                                                    }}
                                                    showAvatar={true}
                                                />
                                            ) : (
                                                <Identity.Placeholder showAvatar={true} />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
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
