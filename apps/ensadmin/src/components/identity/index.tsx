"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ENSNamespaceId,
  ENSNamespaceIds,
  getENSRootChainId,
  getNameAvatarUrl,
} from "@ensnode/datasources";
import { cx } from "class-variance-authority";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { UseEnsNameReturnType, useEnsName } from "wagmi";
import { AddressDisplay, NameDisplay } from "./utils";

interface IdentityProps {
  address: Address;
  namespaceId: ENSNamespaceId;
  showAvatar?: boolean;
  showExternalLinkIcon?: boolean;
  className?: string;
}

/**
 * Displays an ENS identity (name, avatar, etc.) for an Ethereum address on the provided ENS namespace.
 *
 * If the provided address has a primary name set, displays that primary name and links to the profile for that name.
 * Else, if the provided address doesn't have a primary name, displays the truncated address and links to the profile for that address.
 * Also, optionally displays an avatar image and external link.
 */
export function Identity({
  address,
  namespaceId,
  showAvatar = false,
  showExternalLinkIcon = true,
  className = "",
}: IdentityProps) {
  const [mounted, setMounted] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // if the ENS namespace is the ens-test-env, always show the truncated address and not look up the primary name.
  if (namespaceId === ENSNamespaceIds.EnsTestEnv) {
    // TODO: come back to this later only when ENSNode exposes its own APIs for primary name lookups

    return <AddressDisplay address={address} namespaceId={namespaceId} />;
  }

  const ensRootChainId = getENSRootChainId(namespaceId);

  // Lookup the primary name for address using wagmi
  const {
    data: ensName,
    isLoading,
    isError,
  }: UseEnsNameReturnType<string> = useEnsName({
    address,
    chainId: ensRootChainId,
  });

  // If not mounted yet (server-side), or still loading, show a skeleton
  if (!mounted || isLoading) {
    return <IdentityPlaceholder showAvatar={showAvatar} className={className} />;
  }

  // If there is an error looking up the primary name, fallback to showing the address
  if (isError) {
    return (
      <AddressDisplay
        address={address}
        namespaceId={namespaceId}
        showExternalLinkIcon={showExternalLinkIcon}
      />
    );
  }

  const ensAvatarUrl = ensName ? getNameAvatarUrl(ensName, namespaceId) : null;

  return (
    <div className={cx("flex items-center gap-2", className)}>
      {showAvatar && (
        <Avatar className="h-6 w-6">
          {ensName && ensAvatarUrl ? (
            <AvatarImage src={ensAvatarUrl.toString()} alt={ensName} />
          ) : null}
          <AvatarFallback randomAvatarGenerationSeed={address} />
        </Avatar>
      )}
      {ensName ? (
        <NameDisplay
          name={ensName}
          namespaceId={namespaceId}
          showExternalLinkIcon={showExternalLinkIcon}
        />
      ) : (
        <AddressDisplay
          address={address}
          namespaceId={namespaceId}
          showExternalLinkIcon={showExternalLinkIcon}
        />
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
