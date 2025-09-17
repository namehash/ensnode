import { ExternalLinkWithIcon } from "@/components/external-link-with-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAddressDetailsUrl, getChainName } from "@/lib/namespace-utils";
import { ENSNamespaceId } from "@ensnode/datasources";
import { ChainId, Name } from "@ensnode/ensnode-sdk";
import Link from "next/link";
import { PropsWithChildren } from "react";
import { Address } from "viem";

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
 *
 * @returns relative path to the internal name details page for the given name.
 */
export function getNameDetailsRelativePath(name: Name): string {
  return `/name/${encodeURIComponent(name)}`;
}

interface NameLinkProps {
  name: Name;
  className?: string;
}

/**
 * Displays an ENS name with a link to the internal name detail page.
 * Wraps NameDisplay component with navigation to /name/[name].
 *
 * Can take other components (ex.Avatar) as children
 * and display them alongside the link as one common interaction area.
 */

// TODO: What about the naming? See related comment: https://github.com/namehash/ensnode/pull/1072#discussion_r2355343758
export function NameLink({ name, className, children }: PropsWithChildren<NameLinkProps>) {
  const nameDetailsRelativePath = getNameDetailsRelativePath(name);

  return (
    <Link
      href={nameDetailsRelativePath}
      className={`inline-flex items-center gap-2 text-blue-600 hover:underline ${className || ""}`}
    >
      {children}
      <NameDisplay name={name} />
    </Link>
  );
}

interface AddressDisplayProps {
  address: Address;
  className?: string;
}

/**
 * Displays a truncated address without any navigation.
 * Pure display component for showing addresses.
 */
export function AddressDisplay({ address, className = "font-medium" }: AddressDisplayProps) {
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return <span className={className}>{truncatedAddress}</span>;
}

interface AddressLinkProps {
  address: Address;
  namespaceId: ENSNamespaceId;
  chainId: ChainId;
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
export function AddressLink({
  address,
  namespaceId,
  chainId,
  className,
  children,
}: PropsWithChildren<AddressLinkProps>) {
  const ensAppAddressDetailsUrl = getAddressDetailsUrl(address, namespaceId);

  if (!ensAppAddressDetailsUrl) {
    return (
      <UnnamedAddressInfoTooltip chainId={chainId} address={address}>
        {children}
        <AddressDisplay address={address} className={className} />
      </UnnamedAddressInfoTooltip>
    );
  }

  return (
    <UnnamedAddressInfoTooltip chainId={chainId} address={address}>
      <ExternalLinkWithIcon
        href={ensAppAddressDetailsUrl.toString()}
        className={`font-medium ${className || ""}`}
      >
        {children}
        <AddressDisplay address={address} />
      </ExternalLinkWithIcon>
    </UnnamedAddressInfoTooltip>
  );
}

interface UnnamedAddressInfoTooltipProps {
  chainId: ChainId;
  address: Address;
}

/**
 * On hover displays a full address and a chain it belongs to.
 */
const UnnamedAddressInfoTooltip = ({
  children,
  chainId,
  address,
}: PropsWithChildren<UnnamedAddressInfoTooltipProps>) => (
  <Tooltip delayDuration={2000}>
    <TooltipTrigger>{children}</TooltipTrigger>
    <TooltipContent
      side="top"
      className="bg-gray-50 text-sm text-black text-left shadow-md outline-none w-fit"
    >
      Unnamed {getChainName(chainId)} address:
      <br />
      {address}
    </TooltipContent>
  </Tooltip>
);
