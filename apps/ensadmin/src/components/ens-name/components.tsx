"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DeploymentConfigs, type ENSDeploymentChain } from "@ensnode/ens-deployments";
import { cx } from "class-variance-authority";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import type { Hex } from "viem";
import { useEnsName } from "wagmi";
import { useEnsAppUrlQuery, useEnsAvatarUrlQuery } from "./hooks";
import { formatEnsAccountName, nullToUndefined } from "./utils";

interface ENSNameProps {
  address: Hex;
  ensDeploymentChain: ENSDeploymentChain;
  showAvatar?: boolean;
  className?: string;
}

/**
 * Component to display an ENS name for an Ethereum address.
 * Falls back to a truncated address if no ENS name is found.
 */
export function ENSName({ address, ensDeploymentChain, showAvatar = false }: ENSNameProps) {
  const [mounted, setMounted] = useState(false);
  // Handle client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  const ensNameQuery = useEnsName({
    address,
    // get canonical chain ID from ENS Deployment Chain configuration
    chainId: DeploymentConfigs[ensDeploymentChain].eth.chain.id,
    query: {
      // narrow down the result type
      select: nullToUndefined,
    },
  });

  const ensAvatarUrlQuery = useEnsAvatarUrlQuery({
    ensDeploymentChain,
    ensName: ensNameQuery.data,
    showAvatar,
  });

  const ensAppUrlQuery = useEnsAppUrlQuery(ensDeploymentChain);

  const ensDisplayName = formatEnsAccountName(address, ensNameQuery.data);

  // If not mounted yet (server-side), show a skeleton
  if (!mounted) {
    return <ENSNamePlaceholder showAvatar={showAvatar} />;
  }

  return (
    <>
      {showAvatar && (
        <ENSNameAvatar ensAvatarUrlQuery={ensAvatarUrlQuery} ensDisplayName={ensDisplayName} />
      )}

      <ENSDisplayName
        ensAppPath={address}
        ensAppUrlQuery={ensAppUrlQuery}
        ensDisplayName={ensDisplayName}
        ensNameQuery={ensNameQuery}
      />
    </>
  );
}
ENSName.Placeholder = ENSNamePlaceholder;

interface ENSNamePlaceholderProps extends Pick<ENSNameProps, "showAvatar" | "className"> {}

/**
 * Placeholder component for ENS Name
 */
function ENSNamePlaceholder({ showAvatar = false, className = "" }: ENSNamePlaceholderProps) {
  return (
    <div className={cx("flex items-center gap-2", className)}>
      {showAvatar && <Skeleton className="h-6 w-6 rounded-full" />}
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

interface ENSNameAvatarProps {
  ensAvatarUrlQuery: ReturnType<typeof useEnsAvatarUrlQuery>;
  ensDisplayName: string;
}

/**
 * Avatar component for ENS Name.
 * Displays avatar if its URL is available, otherwise displays a placeholder.
 */
function ENSNameAvatar({ ensDisplayName, ensAvatarUrlQuery }: ENSNameAvatarProps) {
  if (ensAvatarUrlQuery.isLoading || ensAvatarUrlQuery.isPending || ensAvatarUrlQuery.isError) {
    if (ensAvatarUrlQuery.error) {
      console.error(
        `ENS Name Avatar URL could not be determined: ${ensAvatarUrlQuery.error.message}`,
      );
    }

    return (
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-xs">{ensDisplayName}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className="h-6 w-6">
      <AvatarImage src={ensAvatarUrlQuery.data.toString()} alt={ensDisplayName} />
      <AvatarFallback className="text-xs">{ensDisplayName}</AvatarFallback>
    </Avatar>
  );
}

interface ENSDisplayNameProps {
  /** either wallet address or domain name  */
  ensAppPath: string;
  /**  */
  ensDisplayName: string;
  ensAppUrlQuery: ReturnType<typeof useEnsAppUrlQuery>;
  ensNameQuery: ReturnType<typeof useEnsName>;
}

/**
 * Presents ENS Name (or formatted address)
 */
export function ENSDisplayName({
  ensAppPath,
  ensAppUrlQuery,
  ensDisplayName,
  ensNameQuery,
}: ENSDisplayNameProps) {
  const textClassName = ensNameQuery.isSuccess ? "font-medium" : "font-mono text-xs";

  if (ensAppUrlQuery.isLoading || ensAppUrlQuery.isPending || ensAppUrlQuery.isError) {
    if (ensAppUrlQuery.error) {
      console.error(
        `Could not include ENS App link for "${ensDisplayName}". Error: ${ensAppUrlQuery.error.message}`,
      );
    }

    return <span className={textClassName}>{ensDisplayName}</span>;
  }

  const ensAppAddressUrl = new URL(ensAppPath, ensAppUrlQuery.data);

  return (
    <a
      href={ensAppAddressUrl.toString()}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-blue-600 hover:underline"
      title={ensAppPath}
    >
      <span className={textClassName}>{ensDisplayName}</span>

      <ExternalLink size={14} className="inline-block" />
    </a>
  );
}
