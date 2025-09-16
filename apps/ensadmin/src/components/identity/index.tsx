"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  NamedAddressFallback,
  UnnamedAddressFallback,
} from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getNameAvatarUrl } from "@/lib/namespace-utils";
import { ENSNamespaceId } from "@ensnode/datasources";
import { usePrimaryName } from "@ensnode/ensnode-react";
import { cx } from "class-variance-authority";
import type { Address } from "viem";
import { AddressLink, NameLink } from "./utils";

interface IdentityProps {
  address: Address;
  namespaceId: ENSNamespaceId;
  showAvatar?: boolean;
  className?: string;
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
  showAvatar = false,
  className = "",
}: IdentityProps) {
  // Lookup the primary name for address using ENSNode
  const { data, status, isLoading } = usePrimaryName({
    address,
    chainId: 1,
  });

  // If not mounted yet (server-side), or still loading, show a skeleton
  if (isLoading || status === "pending") {
    return <IdentityPlaceholder showAvatar={showAvatar} className={className} />;
  }

  // If there is an error looking up the primary name, fallback to showing the address
  if (status === "error") {
    return <AddressLink address={address} namespaceId={namespaceId} />;
  }

  const ensName = data.name;
  const ensAvatarUrl = ensName ? getNameAvatarUrl(ensName, namespaceId) : null;

  return (
    <div className={cx("flex items-center gap-2", className)}>
      {showAvatar && (
        <Avatar className="h-6 w-6">
          {ensName && ensAvatarUrl ? (
            <>
              <AvatarImage src={ensAvatarUrl.toString()} alt={ensName} />
              <AvatarFallback>
                <NamedAddressFallback name={ensName} />
              </AvatarFallback>
            </>
          ) : (
            <AvatarFallback>
              <UnnamedAddressFallback namespaceId={namespaceId} />
            </AvatarFallback>
          )}
        </Avatar>
      )}
      {ensName ? (
        <NameLink name={ensName} />
      ) : (
        <AddressLink address={address} namespaceId={namespaceId} />
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
