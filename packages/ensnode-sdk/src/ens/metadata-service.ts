import type { ENSNamespaceId } from "@ensnode/datasources";
import { ENSNamespaceIds } from "@ensnode/datasources";

import type { BrowserSupportedAssetUrl } from "../shared/url";
import type { Name } from "./types";

/**
 * Builds a browser-supported avatar image URL for an ENS name using the ENS Metadata Service
 * (https://metadata.ens.domains/docs).
 *
 * ENS avatar text records can specify URLs using protocols that browsers don't natively support
 * for direct image rendering, such as ipfs://, ar://, or NFT URIs (eip155:). The ENS Metadata
 * Service acts as a proxy to resolve these non-browser-supported protocols and serve the avatar
 * images via standard HTTP/HTTPS, making them directly usable in <img> tags and other browser
 * contexts.
 *
 * The returned URL uses the BrowserSupportedAssetUrl type, indicating it's safe to use directly
 * in browsers without additional protocol handling.
 *
 * @param {Name} name - ENS name to build the avatar image URL for
 * @param {ENSNamespaceId} namespaceId - ENS Namespace identifier
 * @returns A browser-supported avatar image URL for the name on the given ENS Namespace, or null
 *          if the given ENS namespace is not supported by the ENS Metadata Service
 */
export function buildEnsMetadataServiceAvatarUrl(
  name: Name,
  namespaceId: ENSNamespaceId,
): BrowserSupportedAssetUrl | null {
  switch (namespaceId) {
    case ENSNamespaceIds.Mainnet:
      return new URL(name, `https://metadata.ens.domains/mainnet/avatar/`);
    case ENSNamespaceIds.Sepolia:
      return new URL(name, `https://metadata.ens.domains/sepolia/avatar/`);
    case ENSNamespaceIds.Holesky:
      // metadata.ens.domains doesn't currently support holesky
      return null;
    case ENSNamespaceIds.EnsTestEnv:
      // ens-test-env runs on a local chain and is not supported by metadata.ens.domains
      // TODO: Above comment is not true. Details at https://github.com/namehash/ensnode/issues/1078
      return null;
  }
}
