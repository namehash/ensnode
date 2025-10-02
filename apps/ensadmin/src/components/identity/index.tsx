"use client";

import { ChainIcon } from "@/components/chains/ChainIcon";
import { EnsAvatar } from "@/components/ens-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ENSNamespaceId, getENSRootChainId } from "@ensnode/datasources";
import { usePrimaryName } from "@ensnode/ensnode-react";
import {
  DefaultableChainId,
  getResolvePrimaryNameChainIdParam,
  translateDefaultableChainIdToChainId,
} from "@ensnode/ensnode-sdk";
import * as React from "react";
import type { Address } from "viem";
import { ResolvedIdentity } from "./types";
import { AddressDisplay, IdentityLink, NameDisplay } from "./utils";

interface IdentityProps {
  address: Address;
  namespaceId: ENSNamespaceId;
  chainId?: DefaultableChainId;
  showAvatar?: boolean;
  className?: string;
}

/**
 * Displays the ENS identity as resolved through ENSNode for the
 * provided `address`, `namespaceId`, and `chainId`.
 *
 * If no chainId is provided, the ENS Root Chain Id for the provided
 * `namespaceId` is used.
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
  if (chainId === undefined) {
    // default to resolving the identity for `address` on the ENS Root Chain
    // for the provided `namespaceId`.
    chainId = getENSRootChainId(namespaceId);
  }

  // resolve the primary name for `address` on `chainId` using ENSNode
  const { data, status } = usePrimaryName({
    address,
    chainId: getResolvePrimaryNameChainIdParam(chainId, namespaceId),
  });

  // If loading, show a skeleton
  if (status === "pending") {
    return <IdentityPlaceholder showAvatar={showAvatar} className={className} />;
  }

  const identity: ResolvedIdentity = {
    address,
    name: null, // default to null for the case `status` !== "success"
    namespaceId,
    chainId,
  };

  const renderUnnamedIdentity = () => (
    <IdentityLink identity={identity}>
      {showAvatar && (
        <ChainIcon
          chainId={translateDefaultableChainIdToChainId(identity.chainId, identity.namespaceId)}
          height={24}
          width={24}
        />
      )}
      <AddressDisplay address={identity.address} />
    </IdentityLink>
  );

  // If there is an error looking up the primary name,
  // fallback to showing the unnamed identity
  if (status === "error") return renderUnnamedIdentity();

  identity.name = data.name;

  // If there is no primary name for `address` on `chainId`,
  // fallback to showing the unnamed identity
  if (identity.name === null) return renderUnnamedIdentity();

  // Otherwise, render the named identity we resolved for `address` on `chainId`
  return (
    <IdentityLink
      identity={identity}
      className="inline-flex items-center gap-2 text-blue-600 hover:underline">
      {showAvatar && (
        <EnsAvatar name={identity.name} namespaceId={namespaceId} className="h-6 w-6" />
      )}
      <NameDisplay name={identity.name} />
    </IdentityLink>
  );
}
Identity.Placeholder = IdentityPlaceholder;

interface IdentityPlaceholderProps extends Pick<IdentityProps, "showAvatar" | "className"> {}

function IdentityPlaceholder({ showAvatar = false, className }: IdentityPlaceholderProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showAvatar && <Skeleton className="h-6 w-6 rounded-full" />}
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
