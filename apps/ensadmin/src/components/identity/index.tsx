"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cx } from "class-variance-authority";
import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import {ENSNamespaceId, ENSNamespaceIds, getENSRootChainId} from "@ensnode/datasources";
import {getEnsAppUrl, getEnsMetadataUrl} from "@/components/identity/utils";
import {useEnsName} from "wagmi";
import {useEnsApp} from "@/components/identity/hooks";

//TODO: add descriptions for type's fields
interface IdentityProps {
  address: Address;
  ensNamespaceId: ENSNamespaceId;
  showAvatar?: boolean;
  showExternalLink?: boolean;
  className?: string;
}

/**
 * Component to display an ENS name for an Ethereum address.
 * It can display an avatar if available, a link to the ENS name, or a truncated address.
 */
export function Identity({
  address,
  ensNamespaceId,
  showAvatar = false,
  showExternalLink = true,
  className = "",
}: IdentityProps) {
  const [mounted, setMounted] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Truncate address for display
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  //TODO: if the ENS deployment chain is the ens-test-env, we should not make use of the useEnsName hook at all and instead just always show the truncated address and not look up the primary name.
  // We should document that we'll need to come back to this later after introducing a mechanism for ENSNode to optionally pass an RPC endpoint ENSAdmin for it to make lookups such as this.
  // is that an alright solution? - duplicates code with error of the query, but that seems necessary for our current predicament - allows us to avoid some additional if-ology when calling the wagmi hook
  if (ensNamespaceId === ENSNamespaceIds.EnsTestEnv) {
    return <span className="font-mono text-xs">{truncatedAddress}</span>;
  }

  //TODO: establish the level where we would handle undefined results (ens-test-env for both + holesky for metadata)!!!
  //TODO: not sure about using "ens" in the names, since all we do is basically ens (efp is another topic ;))
  const ensAppBaseUrl = getEnsAppUrl(ensNamespaceId);
  const ensMetadataBaseUrl = getEnsMetadataUrl(ensNamespaceId);
  const chainId = getENSRootChainId(ensNamespaceId);

  // Use the ENS name hook from wagmi
  const { data: ensName, isLoading, isError } = useEnsName({
    address,
    chainId,
  });

  // const ensAppData = useEnsApp(ensNamespaceId, address); a WIP


  // If not mounted yet (server-side), or still loading, show a skeleton
  if (!mounted || isLoading) {
    return <IdentityPlaceholder showAvatar={showAvatar} className={className} />;
  }

  // If there is an error, show the truncated address
  if (isError) {
    return <span className="font-mono text-xs">{truncatedAddress}</span>;
  }

  //TODO: Currently this is where the possibly undefined values of URLs are being handled

  // Get ENS app Name Preview URL
  const ensAppNamePreviewUrl = ensName && ensAppBaseUrl ? new URL(ensName, ensAppBaseUrl) : undefined;

  // Get ENS avatar URL
  const ensAvatarUrl = ensName && ensMetadataBaseUrl ? new URL(ensName, ensMetadataBaseUrl) : undefined; //TODO: wrap in one hook (namespaceId and ensName as inputs), that would possibly return a final URL or undefined - that would streamline the component

  // Display name (ENS name or truncated address)
  const displayName = ensName || truncatedAddress;

  return (
    <div className={cx("flex items-center gap-2", className)}>
      {showAvatar && (
        <Avatar className="h-6 w-6">
          {ensAvatarUrl && ensName && <AvatarImage src={ensAvatarUrl.toString()} alt={ensName} />}
          <AvatarFallback className="text-xs">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      {/*TODO: previously we linked to owners even if they didn't have a primary name set, should we keep doing it?*/}
      {ensAppNamePreviewUrl ? (
        <a
          href={ensAppNamePreviewUrl.toString()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-600 hover:underline"
          title={address}
        >
          <span className={ensName ? "font-medium" : "font-mono text-xs"}>{displayName}</span>
          {showExternalLink && <ExternalLink size={14} className="inline-block" />}
        </a>
      ) : (
        <span className={ensName ? "font-medium" : "font-mono text-xs"}>{displayName}</span>
      )}
    </div>
  );
}
Identity.Placeholder = IdentityPlaceholder;

interface IdentityPlaceholderProps extends Pick<IdentityProps, "showAvatar" | "className"> {}

function IdentityPlaceholder({ showAvatar = false, className = "" }: IdentityPlaceholderProps) {
  return (
    <div className={cx("flex items-center gap-2", className)}>
      {showAvatar && <Skeleton className="h-6 w-6 rounded-full" />}
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
