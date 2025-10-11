import { ChainIcon } from "@/components/chains/ChainIcon";
import { ExternalLinkWithIcon } from "@/components/external-link-with-icon";
import { ResolvedIdentity } from "@/components/identity/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";
import { getAddressDetailsUrl, getChainName } from "@/lib/namespace-utils";
import {
  DEFAULT_EVM_CHAIN_ID,
  Name,
  translateDefaultableChainIdToChainId,
} from "@ensnode/ensnode-sdk";
import Link from "next/link";
import { PropsWithChildren } from "react";
import { Address, getAddress } from "viem";

interface NameDisplayProps {
  name: Name;
  className?: string;
}

/**
 * Displays an ENS name without any navigation.
 * Pure display component for showing names.
 */
export function NameDisplay({ name, className = "font-medium" }: NameDisplayProps) {
  return <span className={className}>{name}</span>;
}

/**
 * Gets the relative path of the internal name details page for a given name.
 */
export function getNameDetailsRelativePath(name: Name): string {
  return `/name/${encodeURIComponent(name)}`;
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
    <Link href={href} className={`${className || ""}`}>
      {children}
    </Link>
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
export function AddressDisplay({ address, className = "font-medium" }: AddressDisplayProps) {
  const checksummedAddress = getAddress(address);
  const truncatedAddress = `${checksummedAddress.slice(0, 6)}...${checksummedAddress.slice(-4)}`;
  return <span className={className}>{truncatedAddress}</span>;
}

interface IdentityLink {
  identity: ResolvedIdentity;
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
export function IdentityLink({ identity, className, children }: PropsWithChildren<IdentityLink>) {
  const ensAppAddressDetailsUrl = getAddressDetailsUrl(identity.address, identity.namespaceId);

  if (!ensAppAddressDetailsUrl) {
    return <IdentityInfoTooltip identity={identity}>{children}</IdentityInfoTooltip>;
  }

  return (
    <IdentityInfoTooltip identity={identity}>
      <ExternalLinkWithIcon
        href={ensAppAddressDetailsUrl.toString()}
        className={`font-medium gap-2 ${className || ""}`}
      >
        {children}
      </ExternalLinkWithIcon>
    </IdentityInfoTooltip>
  );
}

interface IdentityInfoTooltipProps {
  identity: ResolvedIdentity;
}

/**
 * On hover displays details on how the primary name for
 * the address of the identity was resolved.
 */
const IdentityInfoTooltip = ({
  children,
  identity,
}: PropsWithChildren<IdentityInfoTooltipProps>) => {
  const chainDescription =
    identity.chainId === DEFAULT_EVM_CHAIN_ID
      ? 'the "default" EVM Chain'
      : getChainName(identity.chainId);

  const header =
    identity.name !== null
      ? `Primary name on ${chainDescription} for address:`
      : `Unnamed address on ${chainDescription}:`;

  const ensAppAddressDetailsUrl = getAddressDetailsUrl(identity.address, identity.namespaceId);

  const body = ensAppAddressDetailsUrl ? (
    <ExternalLinkWithIcon href={ensAppAddressDetailsUrl.toString()} className={`font-medium gap-2`}>
      <AddressDisplay address={identity.address} />
    </ExternalLinkWithIcon>
  ) : (
    <span className={`font-medium gap-2`}>
      <AddressDisplay address={identity.address} />
    </span>
  );

  return (
    <Tooltip delayDuration={1000}>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-gray-50 text-sm text-black text-left shadow-md outline-none w-fit"
      >
        <div className="flex gap-4">
          <div className="flex items-center">
            <ChainIcon
              chainId={translateDefaultableChainIdToChainId(identity.chainId, identity.namespaceId)}
              height={24}
              width={24}
            />
          </div>
          <div>
            {header}
            <br />
            {body}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
