"use client";

import type { ENSNamespaceId } from "@ensnode/datasources";
import type { Name } from "@ensnode/ensnode-sdk";
import { useQuery } from "@tanstack/react-query";

import type { ConfigParameter, QueryParameter } from "../types";
import { buildEnsMetadataServiceAvatarUrl } from "../utils/ensMetadataService";
import { useENSIndexerConfig } from "./useENSIndexerConfig";
import { useENSNodeConfig } from "./useENSNodeConfig";
import { useRecords } from "./useRecords";

/**
 * Parameters for the useAvatarUrl hook.
 *
 * If `name` is null, the query will not be executed.
 */
export interface UseAvatarUrlParameters extends QueryParameter<string | null>, ConfigParameter {
  name: Name | null;
  /**
   * The ENS namespace ID for the name. Optional - if not provided, it will be automatically
   * fetched from the ENSNode config. This is used for the default ENS Metadata Service fallback.
   */
  namespaceId?: ENSNamespaceId | null;
  /**
   * Optional custom fallback function to get avatar URL when the avatar text record
   * uses a complex protocol (not http/https).
   *
   * If not provided, defaults to using the ENS Metadata Service.
   *
   * @param name - The ENS name to get the avatar URL for
   * @returns Promise resolving to the avatar URL, or null if unavailable
   */
  fallback?: (name: Name) => Promise<string | null>;
}

/**
 * Normalizes a website URL by ensuring it has a valid protocol.
 *
 * @param url - The URL string to normalize
 * @returns A URL object if the input is valid, null otherwise
 *
 * @example
 * ```typescript
 * normalizeWebsiteUrl("example.com") // Returns URL with https://example.com
 * normalizeWebsiteUrl("http://example.com") // Returns URL with http://example.com
 * normalizeWebsiteUrl("invalid url") // Returns null
 * ```
 */
function normalizeWebsiteUrl(url: string | null | undefined): URL | null {
  if (!url) return null;

  try {
    // Try to parse as-is first
    try {
      return new URL(url);
    } catch {
      // If that fails, try adding https:// prefix
      return new URL(`https://${url}`);
    }
  } catch {
    return null;
  }
}

/**
 * Resolves the avatar URL for an ENS name.
 *
 * This hook attempts to get the avatar URL by:
 * 1. Fetching the avatar text record using useRecords
 * 2. Normalizing the avatar text record as a URL
 * 3. Returning the URL if it uses http or https protocol
 * 4. Falling back to the ENS Metadata Service (default) or custom fallback for other protocols
 *
 * @param parameters - Configuration for the avatar URL resolution
 * @returns Query result with the avatar URL, loading state, and error handling
 *
 * @example
 * ```typescript
 * import { useAvatarUrl } from "@ensnode/ensnode-react";
 * import { ENSNamespaceIds } from "@ensnode/datasources";
 *
 * function ProfileAvatar() {
 *   const { data: avatarUrl, isLoading, error } = useAvatarUrl({
 *     name: "vitalik.eth",
 *     namespaceId: ENSNamespaceIds.Mainnet
 *   });
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!avatarUrl) return <div>No avatar</div>;
 *
 *   return <img src={avatarUrl} alt="Avatar" />;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With custom fallback
 * import { useAvatarUrl } from "@ensnode/ensnode-react";
 *
 * function ProfileAvatar() {
 *   const { data: avatarUrl } = useAvatarUrl({
 *     name: "vitalik.eth",
 *     fallback: async (name) => {
 *       // Custom fallback logic for IPFS, NFT URIs, etc.
 *       return `https://custom-resolver.example.com/${name}`;
 *     }
 *   });
 *
 *   return avatarUrl ? <img src={avatarUrl} alt="Avatar" /> : null;
 * }
 * ```
 */
export function useAvatarUrl(parameters: UseAvatarUrlParameters) {
  const {
    name,
    config,
    query: queryOptions,
    fallback,
    namespaceId: providedNamespaceId,
  } = parameters;
  const _config = useENSNodeConfig(config);

  const canEnable = name !== null;

  // First, get the avatar text record
  const recordsQuery = useRecords({
    name,
    selection: { texts: ["avatar"] },
    config: _config,
    query: { enabled: canEnable },
  });

  // Get namespace from config if not provided
  const configQuery = useENSIndexerConfig({ config: _config });
  const namespaceId = providedNamespaceId ?? configQuery.data?.namespace ?? null;

  // Create default fallback using ENS Metadata Service if namespaceId is available
  const defaultFallback =
    namespaceId !== null && namespaceId !== undefined
      ? async (name: Name) => {
          const url = buildEnsMetadataServiceAvatarUrl(name, namespaceId);
          return url?.toString() ?? null;
        }
      : undefined;

  // Use custom fallback if provided, otherwise use default
  const activeFallback = fallback ?? defaultFallback;

  // Then process the avatar URL
  return useQuery({
    queryKey: ["avatarUrl", name, _config.client.url.href, namespaceId, !!fallback],
    queryFn: async (): Promise<string | null> => {
      if (!name || !recordsQuery.data) return null;

      // Get avatar text record from useRecords result
      const avatarTextRecord = recordsQuery.data.records?.texts?.avatar;

      // If no avatar text record, return null
      if (!avatarTextRecord) {
        return null;
      }

      // Try to normalize the avatar URL
      const normalizedUrl = normalizeWebsiteUrl(avatarTextRecord);

      // If normalization failed, return null
      if (!normalizedUrl) {
        return null;
      }

      // If the URL uses http or https protocol, return it
      if (normalizedUrl.protocol === "http:" || normalizedUrl.protocol === "https:") {
        return normalizedUrl.toString();
      }

      // For other protocols (ipfs, data, NFT URIs, etc.), use fallback if available
      if (activeFallback) {
        try {
          return await activeFallback(name);
        } catch {
          return null;
        }
      }

      // No fallback available
      return null;
    },
    enabled: canEnable && recordsQuery.isSuccess,
    retry: false,
    ...queryOptions,
  });
}
