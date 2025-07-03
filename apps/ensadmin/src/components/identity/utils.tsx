import { ENSNamespaceId, getAddressDetailsUrl, getNameDetailsUrl } from "@ensnode/datasources";
import { ExternalLink } from "lucide-react";
import { Address } from "viem";

interface NameDisplayProps {
  namespaceId: ENSNamespaceId;
  name: string;
  showExternalLink?: boolean;
}

/**
 * Component to display an ENS name.
 * Optionally provides a link to the name details page on the ENS Manager App. If not, or if the ENS namespace has no known ENS Manager App, just displays the name (without link).
 */
export function NameDisplay({ name, namespaceId, showExternalLink }: NameDisplayProps) {
  const ensAppNameDetailsUrl = getNameDetailsUrl(name, namespaceId);

  if (!ensAppNameDetailsUrl) {
    return <span className="font-medium">{name}</span>;
  }

  return (
    <a
      href={ensAppNameDetailsUrl.toString()}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
    >
      {name}
      {showExternalLink && <ExternalLink size={14} className="inline-block" />}
    </a>
  );
}

interface AddressDisplayProps {
  namespaceId: ENSNamespaceId;
  address: Address;
  showExternalLink?: boolean;
}

/**
 * Component to display a truncated address.
 * It displays a link to the address details page on ENS app, or just the address if the ENS namespace has no dedicated ENS App.
 */
export function AddressDisplay({ address, namespaceId, showExternalLink }: AddressDisplayProps) {
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
      {showExternalLink && <ExternalLink size={14} className="inline-block" />}
    </a>
  );
}
