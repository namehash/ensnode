import type { PropsWithChildren } from "react";
import { type Address, getAddress } from "viem";

import {
  beautifyName,
  DEFAULT_EVM_CHAIN_ID,
  type ENSNamespaceId,
  type Identity,
  isResolvedIdentity,
  type Name,
  ResolutionStatusIds,
  translateDefaultableChainIdToChainId,
} from "@ensnode/ensnode-sdk";

import { ChainIcon } from "@/components/chains/ChainIcon.tsx";
import { ChainExplorerIcon } from "@/components/icons/ChainExplorerIcon.tsx";
import { EnsIcon } from "@/components/icons/ens/EnsIcon.tsx";
import { CopyButton } from "@/components/special-buttons/CopyButton.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn.ts";
import {
  getAddressDetailsUrl,
  getBlockExplorerUrlForAddress,
  getChainName,
} from "@/utils/namespace.ts";

interface NameDisplayProps {
  name: Name;
  className?: string;
}

/**
 * Displays an ENS name in beautified form.
 *
 * @param name - The name to display in beautified form.
 *
 */
export function NameDisplay({ name, className = "nhui:font-medium" }: NameDisplayProps) {
  const beautifiedName = beautifyName(name);
  return <span className={className}>{beautifiedName}</span>;
}

interface AddressDisplayProps {
  address: Address;
  className?: string;
}

/**
 * Displays a truncated checksummed address without any navigation.
 * Pure display component for showing addresses.
 */
export function AddressDisplay({ address, className }: AddressDisplayProps) {
  const checksummedAddress = getAddress(address);
  const truncatedAddress = `${checksummedAddress.slice(0, 6)}...${checksummedAddress.slice(-4)}`;
  return <span className={className}>{truncatedAddress}</span>;
}

export interface IdentityLinkDetails {
  isExternal: boolean;
  link: URL;
}
interface IdentityLinkProps {
  linkDetails: IdentityLinkDetails;
  className?: string;
}

/**
 * Displays an identifier (address or name) with a link to the identity details URL.
 * If the ENS namespace has a known ENS Manager App,
 * includes a link to the view details of the address within that ENS namespace.
 *
 * Can take other components (ex.ChainIcon) as children
 * and display them alongside the link as one common interaction area.
 */
export function IdentityLink({
  linkDetails,
  className,
  children,
}: PropsWithChildren<IdentityLinkProps>) {
  return (
    <a
      href={linkDetails.link.href}
      target={linkDetails.isExternal ? "_blank" : "_self"}
      className={cn(
        "nhui:text-sm nhui:leading-normal nhui:font-medium nhui:text-blue-600",
        className,
      )}
    >
      {children}
    </a>
  );
}

export interface IdentityTooltipProps {
  identity: Identity;
  namespaceId: ENSNamespaceId;
}

/**
 * On hover displays details on how the primary name for
 * the address of the identity was resolved.
 */
export const IdentityTooltip = ({
  identity,
  namespaceId,
  children,
}: PropsWithChildren<IdentityTooltipProps>) => {
  if (!isResolvedIdentity(identity)) {
    // identity is still loading, don't build any tooltip components yet.
    return children;
  }

  const chainDescription =
    identity.chainId === DEFAULT_EVM_CHAIN_ID
      ? 'the "default" EVM Chain'
      : getChainName(identity.chainId);

  let header: string;

  switch (identity.resolutionStatus) {
    case ResolutionStatusIds.Named:
      header = `Primary name on ${chainDescription} for address:`;
      break;
    case ResolutionStatusIds.Unnamed:
      header = `Unnamed address on ${chainDescription}:`;
      break;
    case ResolutionStatusIds.Unknown:
      header = `Error resolving address on ${chainDescription}:`;
      break;
  }

  const ensAppAddressDetailsUrl = getAddressDetailsUrl(identity.address, namespaceId);

  const body = (
    <span>
      <AddressDisplay address={identity.address} />
    </span>
  );

  const effectiveChainId = translateDefaultableChainIdToChainId(identity.chainId, namespaceId);
  const chainExplorerUrl = getBlockExplorerUrlForAddress(effectiveChainId, identity.address);

  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="top"
        className="nhui:bg-gray-50 nhui:text-sm nhui:text-black nhui:text-left nhui:shadow-md nhui:outline-hidden nhui:w-fit"
      >
        <div className="nhui:flex nhui:gap-4">
          <div className="nhui:flex nhui:items-center">
            <ChainIcon
              chainId={translateDefaultableChainIdToChainId(identity.chainId, namespaceId)}
              height={24}
              width={24}
            />
          </div>
          <div>
            {header}
            <br />
            {body}
          </div>
          <div className="nhui:flex nhui:items-center nhui:gap-2">
            <CopyButton
              value={identity.address}
              className="nhui:text-gray-500 nhui:hover:text-gray-700 nhui:transition-colors"
            />
            {chainExplorerUrl && (
              <a target="_blank" href={chainExplorerUrl.toString()}>
                <ChainExplorerIcon
                  height={24}
                  width={24}
                  className="nhui:text-gray-500 nhui:hover:text-gray-700 nhui:transition-colors"
                />
              </a>
            )}
            {ensAppAddressDetailsUrl && (
              <a target="_blank" href={ensAppAddressDetailsUrl.toString()}>
                <EnsIcon
                  height={24}
                  width={24}
                  className="nhui:text-gray-500 nhui:hover:text-gray-700 nhui:transition-colors"
                />
              </a>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

// TODO: Copied from ENSAwards - some alignment made but further changes may be needed
