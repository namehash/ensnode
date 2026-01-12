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

import { ChainIcon } from "@/components/chains/ChainIcon.tsx";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/useMobile.tsx";
import { cn } from "@/utils/cn.ts";

import { EnsAvatar } from "./EnsAvatar.tsx";
import {
  AddressDisplay,
  IdentityLink,
  type IdentityLinkDetails,
  IdentityTooltip,
  NameDisplay,
} from "./utils";

export interface ResolveAndDisplayIdentityProps {
  identity: UnresolvedIdentity;
  namespaceId: ENSNamespaceId;
  accelerate?: boolean;
  withLink?: boolean;
  identityLinkDetails?: IdentityLinkDetails;
  withTooltip?: boolean;
  withAvatar?: boolean;
  withIdentifier?: boolean;
  className?: string;
}

/**
 * Resolves the provided `UnresolvedIdentity` through ENSNode and displays the result.
 *
 * @param identity - The `UnresolvedIdentity` to resolve and display.
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 *  'ens-test-env')
 * @param accelerate - Whether to attempt Protocol Acceleration (default: false)
 *                      when resolving the primary name.
 * @param withLink - Whether to wrap the displayed identity in an `IdentityLink` component.
 * @param identityLinkDetails - If the `withLink` is true, provides info on where should it lead and should it be an external link.
 * @param withTooltip - Whether to wrap the displayed identity in an `IdentityInfoTooltip` component.
 * @param withAvatar - Whether to display an avatar image.
 * @param withIdentifier - Whether to display identity's textual identifier (address or name).
 * @param className - The class name to apply to the displayed identity.
 */
export function ResolveAndDisplayIdentity({
  identity,
  namespaceId,
  accelerate = true,
  withLink = true,
  identityLinkDetails,
  withTooltip = true,
  withAvatar = false,
  withIdentifier = true,
  className,
}: ResolveAndDisplayIdentityProps) {
  // resolve the primary name for `identity` using ENSNode
  // TODO: extract out the concept of resolving an `Identity` into a provider that child
  //       components can then hook into.
  const { identity: identityResult } = useResolvedIdentity({
    identity,
    accelerate,
  });

  return (
    <DisplayIdentity
      identity={identityResult}
      namespaceId={namespaceId}
      withLink={withLink}
      identityLinkDetails={identityLinkDetails}
      withTooltip={withTooltip}
      withAvatar={withAvatar}
      withIdentifier={withIdentifier}
      className={className}
    />
  );
}

interface DisplayIdentityProps {
  identity: Identity;
  namespaceId: ENSNamespaceId;
  withLink?: boolean;
  identityLinkDetails?: IdentityLinkDetails;
  withTooltip?: boolean;
  withAvatar?: boolean;
  withIdentifier?: boolean;
  className?: string;
}

/**
 * Displays the provided `Identity`.
 *
 * Performs _NO_ resolution if the provided `identity` is not already a `ResolvedIdentity`.
 *
 * @param identity - The identity to display. May be a `ResolvedIdentity` or an `UnresolvedIdentity`.
 *                      If not a `ResolvedIdentity` (and therefore just an `UnresolvedIdentity`) then displays a loading state.
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 *                        'ens-test-env')
 * @param withLink - Whether to wrap the displayed identity in an `IdentityLink` component.
 * @param identityLinkDetails - If the `withLink` is true, provides info on where should it lead and should it be an external link.
 * @param withTooltip - Whether to wrap the displayed identity in an `IdentityInfoTooltip` component.
 * @param withAvatar - Whether to display an avatar image.
 * @param withIdentifier - Whether to display identity's textual identifier (address or name).
 * @param className - The class name to apply to the displayed identity.
 *
 * @throws Error - if `withLink` is true, but no `identityLinkDetails` are provided.
 */
export function DisplayIdentity({
  identity,
  namespaceId,
  withLink = true,
  identityLinkDetails,
  withTooltip = true,
  withAvatar = false,
  withIdentifier = true,
  className,
}: DisplayIdentityProps) {
  let avatar: React.ReactElement;
  let identifier: React.ReactElement;

  const isMobile = useIsMobile();

  if (!isResolvedIdentity(identity)) {
    // identity is an `UnresolvedIdentity` which represents that it hasn't been resolved yet
    // display loading state
    avatar = (
      <Skeleton
        className={cn(
          "nhui:h-10 nhui:w-10 nhui:rounded-full nhui:bg-gray-200",
          isMobile && withIdentifier && "nhui:w-5 nhui:h-5",
        )}
      />
    );
    identifier = (
      <Skeleton
        className={cn(
          "nhui:w-[100px] nhui:h-[14px] nhui:mt-[4px] nhui:mb-[3px] nhui:bg-gray-200",
          className,
        )}
      />
    );
  } else if (
    identity.resolutionStatus === ResolutionStatusIds.Unnamed ||
    identity.resolutionStatus === ResolutionStatusIds.Unknown
  ) {
    avatar = (
      <div
        className={cn(
          "nhui:w-10 nhui:h-10 nhui:flex nhui:justify-center nhui:items-center",
          isMobile && withIdentifier && "nhui:w-5 nhui:h-5",
        )}
      >
        <ChainIcon
          chainId={translateDefaultableChainIdToChainId(identity.chainId, namespaceId)}
          height={isMobile && withIdentifier ? 16 : 24}
          width={isMobile && withIdentifier ? 16 : 24}
        />
      </div>
    );
    identifier = (
      <AddressDisplay
        address={identity.address}
        className={cn(
          "nhui:whitespace-nowrap nhui:hover:underline nhui:hover:underline-offset-[25%]",
          className,
        )}
      />
    );
  } else {
    avatar = (
      <EnsAvatar
        name={identity.name}
        namespaceId={namespaceId}
        className={cn("nhui:h-10 nhui:w-10", isMobile && withIdentifier && "nhui:w-5 nhui:h-5")}
      />
    );
    identifier = (
      <NameDisplay
        name={identity.name}
        className={cn(
          "nhui:w-fit nhui:sm:w-full nhui:whitespace-nowrap nhui:hover:underline nhui:hover:underline-offset-[25%] nhui:overflow-x-auto",
          className,
        )}
      />
    );
  }

  let result = (
    <div className="nhui:inline-flex nhui:items-center nhui:gap-2">
      {/* TODO: extract the `EnsAvatar` / `ChainIcon` out of this component and remove the
      `withAvatar` prop. */}
      {withAvatar && avatar}
      {withIdentifier && identifier}
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
    if (identityLinkDetails === undefined) {
      throw new Error("Invariant(ResolveAndDisplayIdentity): Expected identity link details");
    }
    result = (
      <IdentityLink
        linkDetails={identityLinkDetails}
        identity={identity}
        className={cn("nhui:inline-flex nhui:w-fit nhui:h-fit")}
      >
        {result}
      </IdentityLink>
    );
  }

  return result;
}

// TODO: Copied from ENSAwards (as a newer version) - performed some refactor actions
//  to make the component usable across all our apps, but further alignment might be needed
