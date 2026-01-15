"use client";

import { ChainIcon, EnsAvatar } from "@namehash/namehash-ui";
import type * as React from "react";

import { useResolvedIdentity } from "@ensnode/ensnode-react";
import {
  type ENSNamespaceId,
  type Identity,
  isResolvedIdentity,
  ResolutionStatusIds,
  translateDefaultableChainIdToChainId,
  type UnresolvedIdentity,
} from "@ensnode/ensnode-sdk";

import { Skeleton } from "@/components/ui/skeleton";
import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { cn } from "@/lib/utils";

import { AddressDisplay, IdentityLink, IdentityTooltip, NameDisplay } from "./utils";

interface ResolveAndDisplayIdentityProps {
  identity: UnresolvedIdentity;
  accelerate?: boolean;
  withLink?: boolean;
  withTooltip?: boolean;
  withAvatar?: boolean;
  className?: string;
}

/**
 * Resolves the provided `UnresolvedIdentity` through ENSNode and displays the result.
 *
 * @param identity - The `UnresolvedIdentity` to resolve and display.
 * @param accelerate - Whether to attempt Protocol Acceleration (default: false)
 *                      when resolving the primary name.
 * @param withLink - Whether to wrap the displayed identity in an `IdentityLink` component.
 * @param withTooltip - Whether to wrap the displayed identity in an `IdentityInfoTooltip` component.
 * @param withAvatar - Whether to display an avatar image.
 * @param className - The class name to apply to the displayed identity.
 */
export function ResolveAndDisplayIdentity({
  identity,
  accelerate = false,
  withLink = true,
  withTooltip = true,
  withAvatar = false,
  className,
}: ResolveAndDisplayIdentityProps) {
  const namespaceId = useActiveNamespace();

  // resolve the primary name for `identity` using ENSNode
  // TODO: extract out the concept of resolving an `Identity` into a provider that child
  //       components can then hook into.
  const { identity: identityResult } = useResolvedIdentity({ identity, accelerate });

  return (
    <DisplayIdentity
      identity={identityResult}
      namespaceId={namespaceId}
      withLink={withLink}
      withTooltip={withTooltip}
      withAvatar={withAvatar}
      className={className}
    />
  );
}

interface DisplayIdentityProps {
  identity: Identity;
  namespaceId: ENSNamespaceId;
  withLink?: boolean;
  withTooltip?: boolean;
  withAvatar?: boolean;
  className?: string;
}

/**
 * Displays the provided `Identity`.
 *
 * Performs _NO_ resolution if the provided `identity` is not already a `ResolvedIdentity`.
 *
 * @param identity - The identity to display. May be a `ResolvedIdentity` or an `UnresolvedIdentity`.
 *                      If not a `ResolvedIdentity` (and therefore just an `UnresolvedIdentity`) then displays a loading state.
 * @param withLink - Whether to wrap the displayed identity in an `IdentityLink` component.
 * @param withTooltip - Whether to wrap the displayed identity in an `IdentityInfoTooltip` component.
 * @param withAvatar - Whether to display an avatar image.
 * @param className - The class name to apply to the displayed identity.
 */
export function DisplayIdentity({
  identity,
  namespaceId,
  withLink = true,
  withTooltip = true,
  withAvatar = false,
  className,
}: DisplayIdentityProps) {
  let avatar: React.ReactElement;
  let identitifer: React.ReactElement;

  if (!isResolvedIdentity(identity)) {
    // identity is an `UnresolvedIdentity` which represents that it hasn't been resolved yet
    // display loading state
    avatar = <Skeleton className="h-6 w-6 rounded-full" />;
    identitifer = <Skeleton className={cn("h-4 w-24", className)} />;
  } else if (
    identity.resolutionStatus === ResolutionStatusIds.Unnamed ||
    identity.resolutionStatus === ResolutionStatusIds.Unknown
  ) {
    avatar = (
      <ChainIcon
        chainId={translateDefaultableChainIdToChainId(identity.chainId, namespaceId)}
        height={24}
        width={24}
      />
    );
    identitifer = <AddressDisplay address={identity.address} className={className} />;
  } else {
    avatar = <EnsAvatar name={identity.name} namespaceId={namespaceId} className="h-6 w-6" />;
    identitifer = <NameDisplay name={identity.name} className={className} />;
  }

  let result = (
    <div className="inline-flex items-center gap-2">
      {/* TODO: extract the `EnsAvatar` / `ChainIcon` out of this component and remove the
      `withAvatar` prop. */}
      {withAvatar && avatar}
      {identitifer}
    </div>
  );

  // TODO: extract the `IdentityInfoTooltip` out of this component and remove the `withTooltip` prop.
  if (withTooltip) {
    result = (
      <IdentityTooltip identity={identity} namespaceId={namespaceId}>
        {result}
      </IdentityTooltip>
    );
  }

  // TODO: extract the `IdentityLink` out of this component and remove the `withLink` prop.
  if (withLink) {
    result = (
      <IdentityLink identity={identity} namespaceId={namespaceId}>
        {result}
      </IdentityLink>
    );
  }

  return result;
}
