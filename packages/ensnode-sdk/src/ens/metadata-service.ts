import type { ENSNamespaceId } from "@ensnode/datasources";
import { ENSNamespaceIds } from "@ensnode/datasources";
import { AssetId } from "caip";

import type { BrowserSupportedAssetUrl } from "../shared/url";
import { buildUrl, isBrowserSupportedProtocol, toBrowserSupportedUrl } from "../shared/url";
import type { Name } from "./types";

/**
 * Validates if a string is a valid IPFS URL.
 *
 * @param value - The string to validate
 * @returns True if the value is a valid IPFS URL, false otherwise
 */
function isValidIpfsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "ipfs:";
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid NFT URI using the eip155 protocol.
 *
 * NFT URIs follow the CAIP-22 (ERC-721) or CAIP-29 (ERC-1155) standard format.
 * Uses the caip package's AssetId parser to validate the identifier format
 * and checks that it follows the eip155 namespace with erc721 or erc1155 asset types.
 *
 * @param value - The string to validate as an NFT URI (eip155:/ protocol)
 * @returns True if the value is a valid NFT URI using the eip155 protocol, false otherwise
 *
 * @example
 * // Valid NFT URI - CAIP-22 (ERC-721)
 * isValidNftUri("eip155:1/erc721:0x06012c8cf97BEaD5deAe237070F9587f8E7A266d/771769")
 * // => true
 *
 * @example
 * // Valid NFT URI - CAIP-29 (ERC-1155)
 * isValidNftUri("eip155:1/erc1155:0xfaafdc07907ff5120a76b34b731b278c38d6043c/1")
 * // => true
 */
function isValidNftUri(value: string): boolean {
  try {
    // Use caip package to parse the NFT URI identifier
    const parsed = AssetId.parse(value);

    // Verify it uses the eip155 chain namespace
    if (
      typeof parsed.chainId === "object" &&
      "namespace" in parsed.chainId &&
      parsed.chainId.namespace !== "eip155"
    ) {
      return false;
    }

    // Verify it's an ERC-721 or ERC-1155 token
    if (
      typeof parsed.assetName === "object" &&
      "namespace" in parsed.assetName &&
      parsed.assetName.namespace !== "erc721" &&
      parsed.assetName.namespace !== "erc1155"
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Function type for generating browser-supported asset URLs through a custom proxy.
 *
 * @param name - The ENS name to get the browser supported asset URL for
 * @param assetUrl - The asset URL parsed as a URL object, allowing protocol-specific logic (e.g., ipfs:// vs ar://)
 * @param namespaceId - The ENS namespace identifier for the name
 * @returns The browser supported asset URL, or null if unavailable
 */
export type BrowserSupportedAssetUrlProxy = (
  name: Name,
  assetUrl: URL,
  namespaceId: ENSNamespaceId,
) => BrowserSupportedAssetUrl | null;

/**
 * Default proxy implementation that uses the ENS Metadata Service.
 *
 * @param name - The ENS name to get the browser supported asset URL for
 * @param assetUrl - The asset URL (not used in default implementation)
 * @param namespaceId - The ENS namespace identifier for the name
 * @returns The browser supported asset URL from ENS Metadata Service, or null if unavailable
 */
export const defaultBrowserSupportedAssetUrlProxy: BrowserSupportedAssetUrlProxy = (
  name: Name,
  assetUrl: URL,
  namespaceId: ENSNamespaceId,
): BrowserSupportedAssetUrl | null => {
  return buildEnsMetadataServiceAvatarUrl(name, namespaceId);
};

/**
 * Result returned by buildBrowserSupportedAvatarUrl.
 *
 * Invariant: If rawAssetTextRecord is null, then browserSupportedAssetUrl must also be null.
 */
export interface BrowserSupportedAssetUrlResult {
  /**
   * The original asset text record value from ENS, before any normalization or proxy processing.
   * Null if the asset text record is not set for the ENS name.
   */
  rawAssetTextRecord: string | null;
  /**
   * A browser-supported (http/https/data) asset URL ready for use in <img> tags or other browser contexts.
   * Populated when the rawAssetTextRecord is a valid URL that uses a browser-supported protocol (http, https, or data) or when a url is available to load the asset using a proxy.
   * Null if the asset text record is not set, if the asset text record is malformed/invalid,
   * or if the asset uses a non-browser-supported protocol and no url is known for how to load the asset using a proxy.
   */
  browserSupportedAssetUrl: BrowserSupportedAssetUrl | null;
  /**
   * Indicates whether the browserSupportedAssetUrl uses a proxy service.
   * True if the url uses a proxy (either the default ENS Metadata Service or a custom proxy).
   * False if the URL comes directly from the asset text record, or if there's no asset text record,
   * or if the asset text record has an invalid format, or if no url is known for loading the asset using a proxy.
   */
  usesProxy: boolean;
}

/**
 * Builds a browser-supported asset URL for a name's asset image from the name's raw asset text record value.
 *
 * @param rawAssetTextRecord - The raw asset text record value resolved for `name` on `namespaceId`, or null if `name` has no asset text record on `namespaceId`.
 * @param name - The ENS name whose asset text record value was `rawAssetTextRecord` on `namespaceId`.
 * @param namespaceId - The ENS namespace where `name` has the asset text record set to `rawAssetTextRecord`.
 * @param browserSupportedAssetUrlProxy - Optional function for generating browser support asset urls that route through a custom proxy. If not provided, uses {@link defaultBrowserSupportedAssetUrlProxy}.
 * @returns The {@link BrowserSupportedAssetUrlResult} result
 * @internal
 */
export function buildBrowserSupportedAvatarUrl(
  rawAssetTextRecord: string | null,
  name: Name,
  namespaceId: ENSNamespaceId,
  browserSupportedAssetUrlProxy?: BrowserSupportedAssetUrlProxy,
): BrowserSupportedAssetUrlResult {
  // If no asset text record, return null values
  if (!rawAssetTextRecord) {
    return {
      rawAssetTextRecord: null,
      browserSupportedAssetUrl: null,
      usesProxy: false,
    };
  }

  // Check for valid IPFS URLs or NFT URIs (eip155:/) that require proxy handling
  const requiresProxy = isValidIpfsUrl(rawAssetTextRecord) || isValidNftUri(rawAssetTextRecord);

  // If the asset text record doesn't require a proxy, attempt to use it directly
  if (!requiresProxy) {
    // Try to convert to browser-supported URL first
    try {
      const browserSupportedAssetUrl = toBrowserSupportedUrl(rawAssetTextRecord);

      return {
        rawAssetTextRecord,
        browserSupportedAssetUrl,
        usesProxy: false,
      };
    } catch (error) {
      // toBrowserSupportedUrl failed - could be non-browser-supported protocol or malformed URL
      // Check if it's a hostname validation error
      if (error instanceof Error && error.message.includes("Invalid hostname")) {
        // Hostname validation failed, so the asset text record is malformed/invalid
        // Skip proxy logic and return null
        return {
          rawAssetTextRecord,
          browserSupportedAssetUrl: null,
          usesProxy: false,
        };
      }

      // Try to parse as a general URL to determine which case we're in
      try {
        buildUrl(rawAssetTextRecord);
        // buildUrl succeeded, so the asset text record is a valid URL with a non-browser-supported protocol
        // Continue to proxy handling below
      } catch {
        // buildUrl failed, so the asset text record is malformed/invalid
        // Skip proxy logic and return null
        return {
          rawAssetTextRecord,
          browserSupportedAssetUrl: null,
          usesProxy: false,
        };
      }
    }
  }

  // Invariant: At this point, the asset text record either:
  // 1. Requires a proxy (IPFS URL or NFT URI using eip155:/), OR
  // 2. Is a valid URL with a non-browser-supported protocol (e.g., ar://)
  // In both cases, we attempt to use a proxy to convert to a browser-supported URL.

  // Use custom proxy if provided, otherwise use default
  const activeProxy: BrowserSupportedAssetUrlProxy =
    browserSupportedAssetUrlProxy ?? defaultBrowserSupportedAssetUrlProxy;

  // For non-browser-supported protocols (ipfs://, ar://, eip155:/, etc.), use proxy to convert to browser-supported URL
  try {
    const proxyUrl = activeProxy(name, buildUrl(rawAssetTextRecord), namespaceId);

    // Invariant: BrowserSupportedAssetUrl must pass isBrowserSupportedProtocol check
    if (proxyUrl !== null && !isBrowserSupportedProtocol(proxyUrl)) {
      throw new Error(
        `browserSupportedAssetUrlProxy returned a URL with unsupported protocol: ${proxyUrl.protocol}. BrowserSupportedAssetUrl must use http, https, or data protocol.`,
      );
    }

    return {
      rawAssetTextRecord,
      browserSupportedAssetUrl: proxyUrl,
      usesProxy: proxyUrl !== null,
    };
  } catch {
    return {
      rawAssetTextRecord,
      browserSupportedAssetUrl: null,
      usesProxy: false,
    };
  }
}

/**
 * Builds a browser-supported avatar image URL for an ENS name using the ENS Metadata Service
 * (https://metadata.ens.domains/docs).
 *
 * ENS avatar text records can specify URLs using protocols that browsers don't natively support
 * for direct image rendering, such as ipfs://, ar://, or NFT URIs (eip155:/). The ENS Metadata
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
      return toBrowserSupportedUrl(
        `https://metadata.ens.domains/mainnet/avatar/${encodeURIComponent(name)}`,
      );
    case ENSNamespaceIds.Sepolia:
      return toBrowserSupportedUrl(
        `https://metadata.ens.domains/sepolia/avatar/${encodeURIComponent(name)}`,
      );
    case ENSNamespaceIds.Holesky:
      // metadata.ens.domains doesn't currently support holesky
      return null;
    case ENSNamespaceIds.EnsTestEnv:
      // ens-test-env runs on a local chain and is not supported by metadata.ens.domains
      // TODO: Above comment is not true. Details at https://github.com/namehash/ensnode/issues/1078
      return null;
  }
}
