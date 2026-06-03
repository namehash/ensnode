import type { Name } from "./types/ens";

/** ENS text record types supported by the ENS Metadata Service image endpoints. */
export type EnsMetadataImageRecord = "avatar" | "header";

const METADATA_NETWORKS = {
  mainnet: "mainnet",
  sepolia: "sepolia",
} as const;

type MetadataNetwork = (typeof METADATA_NETWORKS)[keyof typeof METADATA_NETWORKS];

const URI_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

function namespaceIdToMetadataNetwork(namespaceId: string): MetadataNetwork | null {
  switch (namespaceId) {
    case "mainnet":
      return METADATA_NETWORKS.mainnet;
    case "sepolia":
      return METADATA_NETWORKS.sepolia;
    default:
      return null;
  }
}

/**
 * Build an HTTP-compatible image URL for a name on the given ENS namespace that (once fetched)
 * loads the requested profile image record from the ENS Metadata Service
 * (https://metadata.ens.domains/docs).
 *
 * The returned URL is dynamically built based on the provided ENS namespace. Not all ENS
 * namespaces are supported by the ENS Metadata Service. Therefore, the returned URL may be null.
 */
export function getEnsMetadataServiceImageUrl(
  name: Name,
  namespaceId: string,
  record: EnsMetadataImageRecord,
): URL | null {
  // `new URL(name, base)` resolves absolute and protocol-relative `name` values against their
  // own authority, not `base`. Reject URI-like inputs so only a name path segment is appended
  // under `https://metadata.ens.domains/{network}/{record}/`.
  if (name.startsWith("//") || URI_SCHEME_PATTERN.test(name)) return null;

  const network = namespaceIdToMetadataNetwork(namespaceId);
  if (!network) return null;

  return new URL(name, `https://metadata.ens.domains/${network}/${record}/`);
}
