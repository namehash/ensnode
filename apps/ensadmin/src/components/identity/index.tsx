"use client";

import { ChainIcon } from "@/components/chains/ChainIcon";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ENSNamespaceId, getENSRootChainId } from "@ensnode/datasources";
import { usePrimaryName } from "@ensnode/ensnode-react";
import { ChainId } from "@ensnode/ensnode-sdk";
import { cx } from "class-variance-authority";
import * as React from "react";
import type { Address } from "viem";
import { AddressLink, NameLink } from "./utils";

interface IdentityProps {
  address: Address;
  namespaceId: ENSNamespaceId;
  showAvatar?: boolean;
  className?: string;
  chainId?: ChainId;
}

/**
 * Displays an ENS identity (name, avatar, etc.) for an Ethereum address via ENSNode.
 *
 * If the provided address has a primary name set, displays that primary name and links to the profile for that name.
 * Else, if the provided address doesn't have a primary name, displays the truncated address and links to the profile for that address.
 * Also, optionally displays an avatar image and external link.
 */
export function Identity({
  address,
  namespaceId,
  chainId,
  showAvatar = false,
  className = "",
}: IdentityProps) {
  const rootDatasourceChainId = getENSRootChainId(namespaceId);

  // Establish chainId
  const definedChainId = chainId !== undefined ? chainId : rootDatasourceChainId;

  // Resolve chainId for the primary name lookup (better alignment with ENSIP-19)
  const resolvedChainId = definedChainId === rootDatasourceChainId ? 1 : definedChainId;

  // Lookup the primary name for address using ENSNode
  const { data, status, isLoading } = usePrimaryName({
    address,
    chainId: resolvedChainId,
  });

  // If not mounted yet (server-side), or still loading, show a skeleton
  if (isLoading || status === "pending") {
    return <IdentityPlaceholder showAvatar={showAvatar} className={className} />;
  }

  // If there is an error looking up the primary name, fallback to showing the address
  if (status === "error") {
    return (
      <AddressLink address={address} namespaceId={namespaceId} chainId={resolvedChainId}>
        {showAvatar && <ChainIcon chainId={resolvedChainId} />}
      </AddressLink>
    );
  }

  const ensName = data.name;

  return ensName ? (
    <NameLink name={ensName}>
      {showAvatar && <Avatar ensName={ensName} namespaceId={namespaceId} className="h-6 w-6" />}
    </NameLink>
  ) : (
    <AddressLink address={address} namespaceId={namespaceId} chainId={resolvedChainId}>
      {showAvatar && <ChainIcon chainId={resolvedChainId} />}
    </AddressLink>
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
