"use client";

import { type Name, buildEnsMetadataServiceAvatarUrl, buildUrl } from "@ensnode/ensnode-sdk";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import type { ConfigParameter, QueryParameter } from "../types";
import { useENSIndexerConfig } from "./useENSIndexerConfig";
import { useENSNodeConfig } from "./useENSNodeConfig";
import { useRecords } from "./useRecords";

/**
 * The ENS avatar text record key.
 */
const AVATAR_TEXT_RECORD_KEY = "avatar" as const;

/**
 * Protocols supported by browsers for direct image rendering.
 */
const BROWSER_SUPPORTED_PROTOCOLS = ["http:", "https:"] as const;

/**
 * Type alias for avatar URLs. Avatar URLs must be URLs to an image asset
 * accessible via the http or https protocol.
 */
export type AvatarUrl = URL;

/**
 * Parameters for the useAvatarUrl hook.
 *
 * If `name` is null, the query will not be executed.
 */
export interface UseAvatarUrlParameters extends QueryParameter<string | null>, ConfigParameter {
  name: Name | null;
  /**
   * Optional custom fallback function to get avatar URL when the avatar text record
   * uses a non-http/https protocol (e.g., ipfs://, ar://, eip155:/).
   *
   * If not provided, defaults to using the ENS Metadata Service.
   *
   * @param name - The ENS name to get the avatar URL for
   * @returns Promise resolving to the avatar URL, or null if unavailable
   */
  browserUnsupportedProtocolFallback?: (name: Name) => Promise<string | null>;
}

/**
 * Normalizes an avatar URL by ensuring it has a valid protocol.
 * Avatar URLs should be URLs to an image asset accessible via the http or https protocol.
 *
 * If the URL lacks a protocol, https:// is prepended. Non-http/https protocols (e.g., ipfs://, ar://)
 * are preserved and can be handled by fallback mechanisms.
 *
 * @param url - The URL string to normalize
 * @returns A URL object if the input is valid, null otherwise
 *
 * @example
 * ```typescript
 * normalizeAvatarUrl("example.com/avatar.png") // Returns URL with https://example.com/avatar.png
 * normalizeAvatarUrl("http://example.com/avatar.png") // Returns URL with http://example.com/avatar.png
 * normalizeAvatarUrl("ipfs://QmHash") // Returns URL with ipfs://QmHash (requires fallback)
 * normalizeAvatarUrl("invalid url") // Returns null
 * ```
 */
function normalizeAvatarUrl(url: string | null | undefined): AvatarUrl | null {
  if (!url) return null;

  try {
    return buildUrl(url);
  } catch {
    return null;
  }
}

/**
 * Result returned by the useAvatarUrl hook.
 */
export interface UseAvatarUrlResult {
  /**
   * The original avatar text record value from ENS, before any normalization or fallback processing.
   * Null if no avatar record exists.
   */
  rawAvatarUrl: string | null;
  /**
   * A browser-supported (http/https) avatar URL ready for use in <img> tags.
   * Populated when the avatar uses http/https protocol or when a fallback successfully resolves.
   * Null if no avatar exists or resolution fails.
   */
  browserSupportedAvatarUrl: string | null;
  /**
   * Indicates whether the browserSupportedAvatarUrl was obtained via the fallback mechanism
   * (true) or directly from the avatar text record (false).
   */
  fromFallback: boolean;
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
 *
 * function ProfileAvatar({ name }: { name: string }) {
 *   const { data, isLoading } = useAvatarUrl({ name });
 *
 *   const avatarUrl = data?.browserSupportedAvatarUrl;
 *
 *   return (
 *     <div className="avatar">
 *       {isLoading || !avatarUrl ? (
 *         <div className="avatar-placeholder" />
 *       ) : (
 *         <img src={avatarUrl} alt={`${name} avatar`} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With custom fallback
 * import { useAvatarUrl, buildEnsMetadataServiceAvatarUrl } from "@ensnode/ensnode-react";
 *
 * function ProfileAvatar({ name, namespaceId }: { name: string; namespaceId: string }) {
 *   const { data, isLoading } = useAvatarUrl({
 *     name,
 *     browserUnsupportedProtocolFallback: async (name) => {
 *       // Use the ENS Metadata Service for the current namespace
 *       const url = buildEnsMetadataServiceAvatarUrl(name, namespaceId);
 *       return url?.toString() ?? null;
 *     }
 *   });
 *
 *   const avatarUrl = data?.browserSupportedAvatarUrl;
 *
 *   return (
 *     <div className="avatar">
 *       {isLoading || !avatarUrl ? (
 *         <div className="avatar-placeholder" />
 *       ) : (
 *         <img src={avatarUrl} alt={`${name} avatar`} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAvatarUrl(
  parameters: UseAvatarUrlParameters,
): UseQueryResult<UseAvatarUrlResult, Error> {
  const { name, config, query: queryOptions, browserUnsupportedProtocolFallback } = parameters;
  const _config = useENSNodeConfig(config);

  const canEnable = name !== null;

  const recordsQuery = useRecords({
    name,
    selection: { texts: [AVATAR_TEXT_RECORD_KEY] },
    config: _config,
    query: { enabled: canEnable },
  });

  // Get namespace from config
  const configQuery = useENSIndexerConfig({ config: _config });
  const namespaceId = configQuery.data?.namespace ?? null;

  // Create default fallback using ENS Metadata Service if namespaceId is available
  const defaultFallback =
    namespaceId !== null && namespaceId !== undefined
      ? async (name: Name) => {
          const url = buildEnsMetadataServiceAvatarUrl(name, namespaceId);
          return url?.toString() ?? null;
        }
      : undefined;

  // Use custom fallback if provided, otherwise use default
  const activeFallback = browserUnsupportedProtocolFallback ?? defaultFallback;

  // Construct query options object
  const baseQueryOptions: {
    queryKey: readonly unknown[];
    queryFn: () => Promise<UseAvatarUrlResult>;
    enabled: boolean;
    retry: boolean;
    placeholderData: UseAvatarUrlResult;
  } = {
    queryKey: [
      "avatarUrl",
      name,
      _config.client.url.href,
      namespaceId,
      !!browserUnsupportedProtocolFallback,
    ] as const,
    queryFn: async (): Promise<UseAvatarUrlResult> => {
      if (!name || !recordsQuery.data) {
        return {
          rawAvatarUrl: null,
          browserSupportedAvatarUrl: null,
          fromFallback: false,
        };
      }

      const avatarTextRecord = recordsQuery.data.records?.texts?.avatar ?? null;

      // If no avatar text record, return null values
      if (!avatarTextRecord) {
        return {
          rawAvatarUrl: null,
          browserSupportedAvatarUrl: null,
          fromFallback: false,
        };
      }

      // Try to normalize the avatar URL
      const normalizedUrl = normalizeAvatarUrl(avatarTextRecord);

      // If normalization failed, the URL is completely invalid
      if (!normalizedUrl) {
        return {
          rawAvatarUrl: avatarTextRecord,
          browserSupportedAvatarUrl: null,
          fromFallback: false,
        };
      }

      // If the URL uses http or https protocol, return it
      if (
        BROWSER_SUPPORTED_PROTOCOLS.includes(
          normalizedUrl.protocol as (typeof BROWSER_SUPPORTED_PROTOCOLS)[number],
        )
      ) {
        return {
          rawAvatarUrl: avatarTextRecord,
          browserSupportedAvatarUrl: normalizedUrl.toString(),
          fromFallback: false,
        };
      }

      // For other protocols (ipfs, data, NFT URIs, etc.), use fallback if available
      if (activeFallback) {
        try {
          const fallbackUrl = await activeFallback(name);
          return {
            rawAvatarUrl: avatarTextRecord,
            browserSupportedAvatarUrl: fallbackUrl,
            fromFallback: fallbackUrl !== null,
          };
        } catch {
          return {
            rawAvatarUrl: avatarTextRecord,
            browserSupportedAvatarUrl: null,
            fromFallback: false,
          };
        }
      }

      // No fallback available
      return {
        rawAvatarUrl: avatarTextRecord,
        browserSupportedAvatarUrl: null,
        fromFallback: false,
      };
    },
    enabled: canEnable && recordsQuery.isSuccess,
    retry: false,
    placeholderData: {
      rawAvatarUrl: null,
      browserSupportedAvatarUrl: null,
      fromFallback: false,
    } as const,
  };

  const options = {
    ...baseQueryOptions,
    ...queryOptions,
    enabled: canEnable && recordsQuery.isSuccess && (queryOptions?.enabled ?? true),
  } as typeof baseQueryOptions;

  return useQuery<UseAvatarUrlResult, Error>(options);
}
