"use client";

import { ENSName } from "@/components/ens-name/components";
import {
  EnsNode,
  useBlockInfo,
  useEnsDeploymentChain,
  useEnsSubregistryConfig,
  useIndexedNetworkBlock,
  useIndexingStatusQuery,
} from "@/components/ensnode";
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
import {
  differenceInYears,
  formatDistanceToNow,
  fromUnixTime,
  intlFormat,
} from "date-fns";
import { Clock, ExternalLink } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Hex, checksumAddress, getAddress, isAddressEqual } from "viem";
import { getEnsAppUrl } from "../ens-name";
import { blockViewModel } from "../indexing-status/view-models";
import { useRecentRegistrations } from "./hooks";

import { Provider as PonderClientProvider } from "@/components/providers/ponder-client-provider";
import { parseEnsDeploymentChainIntoChainId } from "@/lib/chains";
import DeploymentConfigs, {
  ENSDeploymentChain,
} from "@ensnode/ens-deployments";
import { BlockInfo } from "@ensnode/ponder-metadata";
import { UseQueryResult } from "@tanstack/react-query";

export function RecentRegistrations() {
  const searchParams = useSearchParams();
  const indexingStatus = useIndexingStatusQuery(searchParams);

  if (indexingStatus.isPending || indexingStatus.isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-center"></CardTitle>
        </CardHeader>
        <CardContent>
          <RecentRegistrationsFallback />
        </CardContent>
      </Card>
    );
  }

  if (indexingStatus.isError) {
    return <ErrorMessage error={indexingStatus.error} />;
  }

  return (
    <PonderClientProvider url={selectedEnsNodeUrl(searchParams)}>
      <RecentRegistrationsList ensNodeMetadata={indexingStatus.data} />
    </PonderClientProvider>
  );
}

interface ErrorMessageProps {
  error: Error;
}

function ErrorMessage({ error }: ErrorMessageProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center"></CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <p>Could not load latest ENS Registrations due to error:</p>
          <p>{error.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type RecentRegistrationsListSupportedChains = NonNullable<
  ReturnType<typeof useEnsDeploymentChain>
>;

interface RecentRegistrationsListProps {
  ensNodeMetadata: NonNullable<
    ReturnType<typeof useIndexingStatusQuery>["data"]
  >;
}

function RecentRegistrationsList({
  ensNodeMetadata,
}: RecentRegistrationsListProps) {
  const searchParams = useSearchParams();

  const {
    ensDeploymentChain,
    lastIndexedBlockInfo,
    registrationsStartBlockInfo,
  } = useRecentRegistrationsMetadata({ ensNodeMetadata });

  const recentRegistrationsQuery = useRecentRegistrations({
    searchParams,
    lastIndexedBlockInfo,
    registrationsStartBlockInfo,
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {lastIndexedBlockInfo.isSuccess && (
            <RecentRegistrationsLastIndexedBlock {...lastIndexedBlockInfo} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RegistrationsTable
          isClient={isClient}
          ensDeploymentChain={ensDeploymentChain}
          recentRegistrationsQuery={recentRegistrationsQuery}
          registrationsStartBlockInfo={registrationsStartBlockInfo}
        />
      </CardContent>
    </Card>
  );
}

interface RegistrationsTableProps {
  isClient: boolean;
  ensDeploymentChain: ENSDeploymentChain;
  recentRegistrationsQuery: ReturnType<typeof useRecentRegistrations>;
  registrationsStartBlockInfo: ReturnType<typeof useBlockInfo>;
}

function RegistrationsTable({
  isClient,
  ensDeploymentChain,
  recentRegistrationsQuery,
  registrationsStartBlockInfo,
}: RegistrationsTableProps) {
  if (recentRegistrationsQuery.isLoading) {
    return <RecentRegistrationsFallback />;
  }

  if (recentRegistrationsQuery.isPending) {
    return <RegistrationsPendingToBeFetched {...registrationsStartBlockInfo} />;
  }

  if (recentRegistrationsQuery.isError) {
    return (
      <div className="text-destructive">
        Error loading recent registrations:{" "}
        {recentRegistrationsQuery.error.message}
      </div>
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
        {isClient &&
          recentRegistrationsQuery.data?.registrations.map((registration) => (
            <TableRow key={registration.domain.name}>
              <TableCell className="font-medium">
                <a
                  href={new URL(
                    registration.domain.name,
                    getEnsAppUrl(ensDeploymentChain)
                  ).toString()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  {registration.domain.name}
                  <ExternalLink size={14} className="inline-block" />
                </a>
              </TableCell>
              <TableCell>
                <RelativeTime timestamp={registration.registrationDate} />
              </TableCell>
              <TableCell>
                <Duration
                  registrationDate={registration.registrationDate}
                  expiryDate={registration.expiryDate}
                />
              </TableCell>
              <TableCell>
                <ENSName
                  address={getTrueOwner(
                    ensDeploymentChain,
                    registration.domain.owner,
                    registration.domain.wrappedOwner
                  )}
                  ensDeploymentChain={ensDeploymentChain}
                  showAvatar={true}
                />
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
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
      <div className="h-10 bg-muted rounded w-full"></div>
      <div className="h-10 bg-muted rounded w-full"></div>
      <div className="h-10 bg-muted rounded w-full"></div>
      <div className="h-10 bg-muted rounded w-full"></div>
      <div className="h-10 bg-muted rounded w-full"></div>
    </div>
  );
}

function RecentRegistrationsLastIndexedBlock(
  lastIndexedBlockInfo: UseQueryResult<BlockInfo, Error>
) {
  if (!lastIndexedBlockInfo.data) {
    return <p>Last indexed block is unknown.</p>;
  }

  const lastIndexedBlock = blockViewModel(lastIndexedBlockInfo.data);

  return (
    <div className="flex items-center gap-1.5">
      <Clock size={16} className="text-blue-600" />
      <span className="text-sm font-medium">
        Last indexed block: {lastIndexedBlock.number}
        <span className="ml-1 text-muted-foreground">
          ({getFormattedDateString(lastIndexedBlock.date)})
        </span>
      </span>
    </div>
  );
}

function RegistrationsPendingToBeFetched(
  registrationsStartBlockInfo: UseQueryResult<BlockInfo, Error>
) {
  if (!registrationsStartBlockInfo.data) {
    return <p>Registrations start block is unknown.</p>;
  }

  const registrationsStartBlock = blockViewModel(
    registrationsStartBlockInfo.data
  );

  return (
    <div className="py-4 text-left text-sm text-muted-foreground">
      <p className="mb-2">
        Latest indexed .eth registrations will be displayed here after blocks
        from{" "}
        <code className="inline">
          {registrationsStartBlockInfo.data.number}
        </code>{" "}
        are indexed
        <time
          className="ml-1"
          dateTime={registrationsStartBlock.date.toISOString()}
          title={registrationsStartBlock.date.toISOString()}
        >
          ({getFormattedDateString(registrationsStartBlock.date)})
        </time>
        .
      </p>
      <p>
        While .eth domains are indexed before this date, .eth registrations are
        not.
      </p>
    </div>
  );
}

interface UseRecentRegistrationsMetadataProps {
  ensNodeMetadata: EnsNode.Metadata;
}

function useRecentRegistrationsMetadata({
  ensNodeMetadata,
}: UseRecentRegistrationsMetadataProps) {
  const ensDeploymentChain = ensNodeMetadata.env.ENS_DEPLOYMENT_CHAIN;
  const chainId = parseEnsDeploymentChainIntoChainId(ensDeploymentChain);
  const ensSubregistryConfig = useEnsSubregistryConfig(ensNodeMetadata, "eth");

  const lastIndexedBlockInfo = useIndexedNetworkBlock({
    blockName: "lastIndexedBlock",
    chainId,
    ensNodeMetadata,
  });
  const registrationsStartBlockInfo = useBlockInfo({
    blockNumber: ensSubregistryConfig.data?.contracts.BaseRegistrar.startBlock,
    chainId,
  });

  return {
    ensDeploymentChain,
    lastIndexedBlockInfo,
    registrationsStartBlockInfo,
  };
}

// Helper function to get formatted date for display
const getFormattedDateString = (date: Date): string => {
  return intlFormat(date, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Helper function to calculate duration in years
const calculateDurationYears = (
  registrationDate: string,
  expiryDate: string
) => {
  try {
    const registrationTimestamp = parseInt(registrationDate);
    const expiryTimestamp = parseInt(expiryDate);

    if (isNaN(registrationTimestamp) || isNaN(expiryTimestamp)) {
      return "Unknown";
    }

    const registrationDate_ = fromUnixTime(registrationTimestamp);
    const expiryDate_ = fromUnixTime(expiryTimestamp);
    const years = differenceInYears(expiryDate_, registrationDate_);

    // If less than a year, show months instead
    if (years === 0) {
      // Calculate months by getting the difference in milliseconds and converting to months
      const diffInMs = expiryDate_.getTime() - registrationDate_.getTime();
      const months = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 30));
      return `${months} month${months !== 1 ? "s" : ""}`;
    }

    return `${years} year${years !== 1 ? "s" : ""}`;
  } catch (error) {
    console.error("Error calculating duration:", error);
    return "Unknown";
  }
};

// Helper function to format relative time
const formatRelativeTime = (timestamp: string) => {
  try {
    const parsedTimestamp = parseInt(timestamp);
    if (isNaN(parsedTimestamp)) {
      return "Unknown";
    }

    const date = fromUnixTime(parsedTimestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "Unknown";
  }
};

// Client-only relative time component
function RelativeTime({ timestamp }: { timestamp: string }) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    setRelativeTime(formatRelativeTime(timestamp));
  }, [timestamp]);

  return <>{relativeTime}</>;
}

// Client-only duration component
function Duration({
  registrationDate,
  expiryDate,
}: {
  registrationDate: string;
  expiryDate: string;
}) {
  const [duration, setDuration] = useState<string>("");

  useEffect(() => {
    setDuration(calculateDurationYears(registrationDate, expiryDate));
  }, [registrationDate, expiryDate]);

  return <>{duration}</>;
}

/**
 * Determines the true owner of a domain.
 * If the owner is the NameWrapper contract, returns the wrapped owner instead.
 *
 * @param owner The owner address
 * @param wrappedOwner The wrapped owner address (optional)
 * @returns The true owner address
 */
function getTrueOwner(
  ensDeploymentChain: ENSDeploymentChain,
  owner: { id: Hex },
  wrappedOwner?: { id: Hex }
) {
  const nameWrapperContractAddress =
    DeploymentConfigs[ensDeploymentChain].eth.contracts.NameWrapper.address;

  // Only use wrapped owner if the owner is the NameWrapper contract
  if (
    wrappedOwner?.id &&
    isAddressEqual(owner.id, nameWrapperContractAddress)
  ) {
    return getAddress(checksumAddress(wrappedOwner.id));
  }

  // Otherwise, use the regular owner
  return getAddress(checksumAddress(owner.id));
}
