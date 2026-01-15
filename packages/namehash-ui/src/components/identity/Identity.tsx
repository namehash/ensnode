import { CheckIcon, CopyIcon } from "lucide-react";
import type { PropsWithChildren } from "react";
import * as React from "react";

import type { ENSNamespaceId, Identity } from "@ensnode/ensnode-sdk";
import {
  DEFAULT_EVM_CHAIN_ID,
  isResolvedIdentity,
  ResolutionStatusIds,
  translateDefaultableChainIdToChainId,
} from "@ensnode/ensnode-sdk";

import { getBlockExplorerAddressDetailsUrl } from "../../utils/blockExplorers";
import { getChainName } from "../../utils/chains";
import { cn } from "../../utils/cn";
import { getEnsManagerAddressDetailsUrl } from "../../utils/ensManager";
import { ChainIcon } from "../chains/ChainIcon";
import { ChainExplorerIcon } from "../icons/ChainExplorerIcon";
import { EnsIcon } from "../icons/ens/EnsIcon";
import { CopyButton } from "../special-buttons/CopyButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { AddressDisplay } from "./Address";

export interface IdentityLinkDetails {
  isExternal: boolean;
  link: URL | null;
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
  if (linkDetails.link === null) {
    return <>{children}</>;
  }

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

  const ensAppAddressDetailsUrl = getEnsManagerAddressDetailsUrl(identity.address, namespaceId);

  const body = (
    <span>
      <AddressDisplay address={identity.address} />
    </span>
  );

  const effectiveChainId = translateDefaultableChainIdToChainId(identity.chainId, namespaceId);
  const chainExplorerUrl = getBlockExplorerAddressDetailsUrl(effectiveChainId, identity.address);

  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="top"
        className="nhui:bg-gray-50 nhui:text-sm nhui:text-black nhui:text-left nhui:shadow-md nhui:outline-hidden nhui:w-fit [&_svg]:fill-gray-50 [&_svg]:bg-gray-50"
      >
        {/*TODO: The styling of the tooltip should either be unified across all our apps or made customizable. */}
        {/*Currently aligned to fit ensadmin, cause it's only used there*/}
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
              successIcon={<CheckIcon className="nhui:h-4 nhui:w-4" />}
              icon={<CopyIcon className="nhui:h-4 nhui:w-4" />}
              showToast={true}
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
