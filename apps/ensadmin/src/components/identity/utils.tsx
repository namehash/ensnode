import { getAddressDetailsUrl, getNameDetailsUrl } from "@/lib/namespace-utils";
import { ENSNamespaceId } from "@ensnode/datasources";
import { Name } from "@ensnode/ensnode-sdk";
import { ExternalLink } from "lucide-react";
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
      <ExternalLink size={12} />
    </a>
  );
}

interface NamePageLinkProps {
  name: Name;
  className?: string;
}

/**
 * Displays an ENS name with a link to the internal name detail page.
 * Wraps NameDisplay component with navigation to /name/[name].
 */
export function NamePageLink({ name, className }: NamePageLinkProps) {
  return (
    <Link
      href={`/name/${encodeURIComponent(name)}`}
      className={`flex items-center gap-1 text-blue-600 hover:underline ${className || ""}`}
    >
      <NameDisplay name={name} />
    </Link>
  );
}

interface NameLinkProps {
  name: Name;
  namespaceId: ENSNamespaceId;
  className?: string;
}

/**
 * Displays an ENS name with a link. Determines if the link is external by checking
 * if the URL from getNameDetailsUrl() starts with "http" protocol.
 * External links render with an external link icon and open in a new tab.
 * Internal links render as standard Next.js Link components.
 */
export function NameLink({ name, namespaceId, className }: NameLinkProps) {
  const nameDetailsUrl = getNameDetailsUrl(name, namespaceId);
  const isExternal = nameDetailsUrl.startsWith("http");

  if (isExternal) {
    return (
      <ExternalLinkWithIcon href={nameDetailsUrl} className={className}>
        <NameDisplay name={name} />
      </ExternalLinkWithIcon>
    );
  }

  return (
    <Link
      href={nameDetailsUrl}
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
    return <span className="font-mono text-xs">{truncatedAddress}</span>;
  }

  return (
    <a
      href={ensAppAddressDetailsUrl.toString()}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
    >
      {truncatedAddress}
    </a>
  );
}
