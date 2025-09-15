import { ExternalLinkWithIcon } from "@/components/external-link-with-icon";
import { getAddressDetailsUrl } from "@/lib/namespace-utils";
import { ENSNamespaceId } from "@ensnode/datasources";
import { Name } from "@ensnode/ensnode-sdk";
import Link from "next/link";
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
 */
export function NameLink({ name, className }: NameLinkProps) {
  const nameDetailsRelativePath = getNameDetailsRelativePath(name);

  return (
    <Link
      href={nameDetailsRelativePath}
      className={`inline-flex items-center gap-1 text-blue-600 hover:underline ${className || ""}`}
    >
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
  className?: string;
}

/**
 * Displays a truncated address with a link to the address details URL.
 * If the ENS namespace has a known ENS Manager App,
 * includes a link to the view details of the address within that ENS namespace.
 */
export function AddressLink({ address, namespaceId, className }: AddressLinkProps) {
  const ensAppAddressDetailsUrl = getAddressDetailsUrl(address, namespaceId);

  if (!ensAppAddressDetailsUrl) {
    return <AddressDisplay address={address} className={className} />;
  }

  return (
    <ExternalLinkWithIcon
      href={ensAppAddressDetailsUrl.toString()}
      className={`font-medium ${className || ""}`}
    >
      <AddressDisplay address={address} />
    </ExternalLinkWithIcon>
  );
}
