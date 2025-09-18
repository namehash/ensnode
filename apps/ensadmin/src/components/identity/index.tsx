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
  className,
}: IdentityProps) {
  const ensRootChainId = getENSRootChainId(namespaceId);

  // Establish chainId, preferring user-supplied and defaulting to the ENS Root Chain Id.
  const definedChainId = chainId ?? ensRootChainId;

  // Lookup the primary name for address using ENSNode
  const { data, status } = usePrimaryName({
    address,
    // NOTE(ENSIP-19): the Primary Name for the ENS Root Chain is always using chainId: 1
    chainId: definedChainId === ensRootChainId ? 1 : definedChainId,
  });

  // If loading, show a skeleton
  if (status === "pending") {
    return <IdentityPlaceholder showAvatar={showAvatar} className={className} />;
  }

  const renderAddress = () => (
    <AddressLink address={address} namespaceId={namespaceId} chainId={definedChainId}>
      {showAvatar && <ChainIcon chainId={definedChainId} height={24} width={24} />}
    </AddressLink>
  );

  // If there is an error looking up the primary name, fallback to showing the address
  if (status === "error") return renderAddress();

  const ensName = data.name;

  // If there is no primary name for the resolvedChainId, fallback to showing the address
  if (ensName === null) return renderAddress();

  // Otherwise, render the primary name
  return (
    <NameLink name={ensName}>
      {showAvatar && <Avatar ensName={ensName} namespaceId={namespaceId} className="h-6 w-6" />}
    </NameLink>
  );
}
Identity.Placeholder = IdentityPlaceholder;

interface IdentityPlaceholderProps extends Pick<IdentityProps, "showAvatar" | "className"> {}

function IdentityPlaceholder({ showAvatar = false, className }: IdentityPlaceholderProps) {
  return (
    <div className={cx("flex items-center gap-2", className)}>
      {showAvatar && <Skeleton className="h-6 w-6 rounded-full" />}
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
