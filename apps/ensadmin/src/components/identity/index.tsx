"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cx } from "class-variance-authority";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import {
  ENSNamespaceId,
  ENSNamespaceIds, getEnsNameAvatarUrl,
  getENSRootChainId
} from "@ensnode/datasources";
import {useEnsName} from "wagmi";
import {NameDisplay} from "@/components/recent-registrations/utils";

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

  const chainId = getENSRootChainId(ensNamespaceId);

  // Use the ENS name hook from wagmi
  const { data: ensName, isLoading, isError } = useEnsName({
    address,
    chainId
  });

  // If not mounted yet (server-side), or still loading, show a skeleton
  if (!mounted || isLoading) {
    return <IdentityPlaceholder showAvatar={showAvatar} className={className} />;
  }

  // If there is an error, show the truncated address
  if (isError) {
    return <span className="font-mono text-xs">{truncatedAddress}</span>;
  }

  // Get ENS avatar URL
  const ensAvatarUrl = ensName ? getEnsNameAvatarUrl(ensNamespaceId, ensName) : undefined;

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
      {/*TODO: previously we linked to owners even if they didn't have a primary name set, should we keep doing it? (Current version comes from PR #476 where we didn't do that)*/}
      {ensName ? (
        <NameDisplay namespaceId={ensNamespaceId} ensName={ensName} showExternalLink={showExternalLink}/>
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
