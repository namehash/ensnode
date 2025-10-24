import { ChainIcon } from "@/components/chains/ChainIcon";
import { CopyButton } from "@/components/copy-button";
import { ChainExplorerIcon } from "@/components/icons/chain-explorer-icon";
import { IconENS } from "@/components/icons/ens";
import { ExternalLink, InternalLink } from "@/components/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";
import {
  getAddressDetailsUrl,
  getBlockExplorerUrlForAddress,
  getChainName,
} from "@/lib/namespace-utils";
import {
  DEFAULT_EVM_CHAIN_ID,
  ENSNamespaceId,
  Identity,
  Name,
  ResolutionStatusIds,
  beautifyName,
  isResolvedIdentity,
  translateDefaultableChainIdToChainId,
} from "@ensnode/ensnode-sdk";
import { PropsWithChildren } from "react";
import { Address, getAddress } from "viem";

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
export function NameDisplay({ name, className = "font-medium" }: NameDisplayProps) {
  const beautifiedName = beautifyName(name);
  return <span className={className}>{beautifiedName}</span>;
}

/**
 * Gets the relative path of the internal name details page for a given name.
 */
export function getNameDetailsRelativePath(name: Name): string {
  return `/name?name=${encodeURIComponent(name)}`;
}

interface NameLinkProps {
  name: Name;
  className?: string;
}

/**
 * Displays an ENS name with a link to the internal name detail page that
 * retains the current connection URL parameter if it exists.
 *
 * Can take other components (ex.Avatar) as children
 * and display them alongside the link as one common interaction area.
 */
export function NameLink({ name, className, children }: PropsWithChildren<NameLinkProps>) {
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();
  const href = retainCurrentRawConnectionUrlParam(getNameDetailsRelativePath(name));

  return (
    <InternalLink href={href} className={className}>
      {children}
    </InternalLink>
  );
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

interface IdentityLinkProps {
  identity: Identity;
  namespaceId: ENSNamespaceId;
  className?: string;
}

/**
 * Displays a truncated address with a link to the address details URL.
 * If the ENS namespace has a known ENS Manager App,
 * includes a link to the view details of the address within that ENS namespace.
 *
 * Can take other components (ex.ChainIcon) as children
 * and display them alongside the link as one common interaction area.
 */
export function IdentityLink({
  identity,
  namespaceId,
  className,
  children,
}: PropsWithChildren<IdentityLinkProps>) {
  const ensAppAddressDetailsUrl = getAddressDetailsUrl(identity.address, namespaceId);

  if (!ensAppAddressDetailsUrl) {
    return <>{children}</>;
  }

  // TODO: build an "internal" address details page so that we can convert this to an
  // `InternalLink`. We are proactively converting this from an `ExternalLinkWithIcon`
  // to an `ExternalLink` (without icon) in preparation for this future enhancement.
  return (
    <ExternalLink href={ensAppAddressDetailsUrl.toString()} className={className}>
      {children}
    </ExternalLink>
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
    <Tooltip delayDuration={1000}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-gray-50 text-sm text-black text-left shadow-md outline-none w-fit"
      >
        <div className="flex gap-4">
          <div className="flex items-center">
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
          <div className="flex items-center gap-2">
            <CopyButton
              value={identity.address}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            />
            {chainExplorerUrl && (
              <ExternalLink href={chainExplorerUrl.toString()}>
                <ChainExplorerIcon
                  height={24}
                  width={24}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                />
              </ExternalLink>
            )}
            {ensAppAddressDetailsUrl && (
              <ExternalLink href={ensAppAddressDetailsUrl.toString()}>
                <IconENS
                  height={24}
                  width={24}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                />
              </ExternalLink>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
