import { getAddressDetailsUrl } from "@/lib/namespace-utils";
import { ENSNamespaceId } from "@ensnode/datasources";
import { Name } from "@ensnode/ensnode-sdk";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
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

interface ExternalLinkWithIconProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * Renders an external link with an external link icon.
 * General-purpose component for any external URL.
 */
export function ExternalLinkWithIcon({ href, children, className }: ExternalLinkWithIconProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-1 text-blue-600 hover:underline ${className || ""}`}
    >
      {children}
      <ExternalLinkIcon size={12} />
    </a>
  );
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
      className={`flex items-center gap-1 text-blue-600 hover:underline ${className || ""}`}
    >
      <NameDisplay name={name} />
    </Link>
  );
}

interface AddressDisplayProps {
  address: Address;
  namespaceId: ENSNamespaceId;
}

/**
 * Displays a truncated address.
 * If the ENS namespace has a known ENS Manager App,
 * includes a link to the view details of the address within that ENS namespace.
 */
export function AddressDisplay({ address, namespaceId }: AddressDisplayProps) {
  // Truncate address for display
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const ensAppAddressDetailsUrl = getAddressDetailsUrl(address, namespaceId);

  if (!ensAppAddressDetailsUrl) {
    return <span className="font-medium">{truncatedAddress}</span>;
  }

  return (
    <ExternalLinkWithIcon href={ensAppAddressDetailsUrl.toString()} className="font-medium">
      {truncatedAddress}
    </ExternalLinkWithIcon>
  );
}
