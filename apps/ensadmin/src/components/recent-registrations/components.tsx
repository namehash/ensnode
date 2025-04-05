"use client";

import { ENSName, ENSRegistration } from "@/components/ens-name/components";
import { EnsNode, useBlockInfo, useIndexingStatusQuery } from "@/components/ensnode";
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
import { differenceInYears, formatDistanceToNow, fromUnixTime, intlFormat } from "date-fns";
import { Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Hex, checksumAddress, getAddress, isAddressEqual } from "viem";
import { getEnsAppUrl, getEnsMetadataUrl } from "../ens-name";
import { blockViewModel } from "../indexing-status/view-models";
import { useRecentRegistrations } from "./hooks";

import {
  selectEnsDeploymentChain,
  selectEnsSubregistryConfig,
  selectIndexedNetworkBlock,
} from "@/components/ensnode/data-helpers";
import { SubregistryDeploymentConfig } from "@ensnode/ens-deployments";
import { useEnsName } from "wagmi";
import { Registration } from "./types";

/**
 * Component to display the most recently registered .eth domains that have been indexed.
 */
export function RecentRegistrations() {
  const searchParams = useSearchParams();
  const ensNodeUrl = selectedEnsNodeUrl(searchParams);

  const indexingStatusQuery = useIndexingStatusQuery(ensNodeUrl);
  const recentRegistrationsQuery = useRecentRegistrations(ensNodeUrl);

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

  if (recentRegistrationsQuery.isSuccess && indexingStatusQuery.isSuccess) {
    return (
      <RecentRegistrationsList
        ensNodeMetadata={indexingStatusQuery.data}
        registrations={recentRegistrationsQuery.data}
      />
    );
  }

  // If the component is in an unexpected state, throw an error
  throw new Error("Unexpected state of RecentRegistrations component");
}

interface RecentRegistrationsListProps {
  ensNodeMetadata: EnsNode.Metadata;
  registrations: Array<Registration>;
}

function RecentRegistrationsList({ ensNodeMetadata, registrations }: RecentRegistrationsListProps) {
  const ensSubregistryConfig = selectEnsSubregistryConfig(ensNodeMetadata, "eth");
  const ensDeploymentChain = selectEnsDeploymentChain(ensNodeMetadata);

  const ensAppUrl = getEnsAppUrl(ensDeploymentChain);
  const ensMetadataUrl = getEnsMetadataUrl(ensDeploymentChain);

  const lastIndexedBlockInfo = selectIndexedNetworkBlock({
    blockName: "lastIndexedBlock",
    chainId: ensSubregistryConfig.chain.id,
    ensNodeMetadata,
  });

  const registrationsStartBlockInfo = useBlockInfo({
    blockNumber: ensSubregistryConfig.contracts.BaseRegistrar.startBlock,
    chainId: ensSubregistryConfig.chain.id,
  });

  const lastIndexedBlock = lastIndexedBlockInfo ? blockViewModel(lastIndexedBlockInfo) : null;
  const registrationsStartBlock = registrationsStartBlockInfo
    ? blockViewModel(registrationsStartBlockInfo)
    : null;

  // If possible, check if the current indexing block is before the block where registrations started to be tracked
  const isBeforeBaseRegistrarBlock =
    lastIndexedBlock && registrationsStartBlock
      ? lastIndexedBlock.date < registrationsStartBlock.date
      : false;

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {lastIndexedBlock && (
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-blue-600" />
              <span className="text-sm font-medium">
                Last indexed block: {lastIndexedBlock.number}
                <span className="ml-1 text-muted-foreground">
                  ({getFormattedDateString(lastIndexedBlock.date)})
                </span>
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isBeforeBaseRegistrarBlock && registrationsStartBlock ? (
          <div className="py-4 text-left text-sm text-muted-foreground">
            <p className="mb-2">
              Latest indexed .eth registrations will be displayed here after blocks from{" "}
              <pre className="inline">{registrationsStartBlock.number}</pre> are indexed
              <time
                className="ml-1"
                dateTime={registrationsStartBlock.date.toISOString()}
                title={registrationsStartBlock.date.toISOString()}
              >
                ({getFormattedDateString(registrationsStartBlock.date)})
              </time>
              .
            </p>
            <p>While .eth domains are indexed before this date, .eth registrations are not.</p>
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
                registrations.map((registration) => (
                  <RegistrationRow
                    key={registration.domain.name}
                    registration={registration}
                    ensSubregistryConfig={ensSubregistryConfig}
                    ensAppUrl={ensAppUrl}
                    ensMetadataUrl={ensMetadataUrl}
                  />
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

interface RegistrationRowProps {
  registration: Registration;

  ensSubregistryConfig: SubregistryDeploymentConfig;

  // NOTE: not every ENS deployment has an ENS app URL
  ensAppUrl: URL | undefined;

  // NOTE: not every ENS deployment has an ENS metadata URL
  ensMetadataUrl: URL | undefined;
}

function RegistrationRow({
  registration,
  ensAppUrl,
  ensMetadataUrl,
  ensSubregistryConfig,
}: RegistrationRowProps) {
  const ensNameQuery = useEnsName({
    address: getTrueOwner(registration.domain.owner, registration.domain.wrappedOwner),
    chainId: ensSubregistryConfig.chain.id,
  });

  return (
    <TableRow key={registration.domain.name}>
      <TableCell className="font-medium">
        <ENSRegistration registration={registration} ensAppUrl={ensAppUrl} />
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
          address={getTrueOwner(registration.domain.owner, registration.domain.wrappedOwner)}
          ens={{
            appBaseUrl: ensAppUrl,
            metadataBaseUrl: ensMetadataUrl,
            nameQuery: ensNameQuery,
          }}
          showAvatar={true}
        />
      </TableCell>
    </TableRow>
  );
}

// Helper function to calculate duration in years
const calculateDurationYears = (registrationDate: string, expiryDate: string) => {
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

// Helper function to get formatted date for display
const getFormattedDateString = (date: Date): string => {
  return intlFormat(date, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// The NameWrapper contract address
const NAME_WRAPPER_ADDRESS = "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401";

/**
 * Determines the true owner of a domain.
 * If the owner is the NameWrapper contract, returns the wrapped owner instead.
 *
 * @param owner The owner address
 * @param wrappedOwner The wrapped owner address (optional)
 * @returns The true owner address
 */
function getTrueOwner(owner: { id: Hex }, wrappedOwner?: { id: Hex }) {
  // Only use wrapped owner if the owner is the NameWrapper contract
  if (wrappedOwner?.id && isAddressEqual(owner.id, NAME_WRAPPER_ADDRESS)) {
    return getAddress(checksumAddress(wrappedOwner.id));
  }

  // Otherwise, use the regular owner
  return getAddress(checksumAddress(owner.id));
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
