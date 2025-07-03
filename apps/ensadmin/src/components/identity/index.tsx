"use client";

import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ENSNamespaceId, ENSNamespaceIds, getENSRootChainId } from "@ensnode/datasources";
import { cx } from "class-variance-authority";
import { useEffect, useState } from "react";
import type { Address } from "viem";
import { UseEnsNameReturnType, useEnsName } from "wagmi";
import { AddressDisplay, NameDisplay } from "./utils";

interface IdentityProps {
  address: Address;
  namespaceId: ENSNamespaceId;
  showAvatar?: boolean;
  showExternalLink?: boolean;
  className?: string;
}

/**
 * Displays an ENS identity (name, avatar, etc.) for an Ethereum address on the provided ENS namespace.
 * It can display an avatar if available, a link to the ENS name, or a truncated address.
 */
export function Identity({
  address,
  namespaceId,
  showAvatar = false,
  showExternalLink = true,
  className = "",
}: IdentityProps) {
  const [mounted, setMounted] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // if the ENS namespace is the ens-test-env, always show the truncated address and not look up the primary name.
  if (namespaceId === ENSNamespaceIds.EnsTestEnv) {
    // TODO: come back to this later after introducing a mechanism for ENSNode
    //  to optionally pass an RPC endpoint ENSAdmin for it to make lookups such as this (for ens-test-env).

    return <AddressDisplay namespaceId={namespaceId} address={address} />;
  }

  const ensRootChainId = getENSRootChainId(namespaceId);

  // Use the ENS name hook from wagmi
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

  // If there is an error, show the address
  if (isError) {
    return (
      <AddressDisplay
        namespaceId={namespaceId}
        address={address}
        showExternalLink={showExternalLink}
      />
    );
  }

  return (
    <div className={cx("flex items-center gap-2", className)}>
      {showAvatar && <Avatar className="h-6 w-6" namespaceId={namespaceId} name={ensName} />}
      {ensName ? (
        <NameDisplay namespaceId={namespaceId} name={ensName} showExternalLink={showExternalLink} />
      ) : (
        <AddressDisplay
          namespaceId={namespaceId}
          address={address}
          showExternalLink={showExternalLink}
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
