"use client";

import {
  type BrowserSupportedAssetUrl,
  type Name,
  buildEnsMetadataServiceAvatarUrl,
  buildUrl,
  isHttpProtocol,
} from "@ensnode/ensnode-sdk";
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
 * Parameters for the useAvatarUrl hook.
 */
export interface UseAvatarUrlParameters extends QueryParameter<string | null>, ConfigParameter {
  /**
   * If null, the query will not be executed.
   */
  name: Name | null;
  /**
   * Optional custom fallback function to get avatar URL when the avatar text record
   * uses a non-http/https protocol (e.g., ipfs://, ar://, eip155:/).
   *
   * If not provided, defaults to using the ENS Metadata Service as a fallback proxy for browser-supported avatar urls.
   *
   * @param name - The ENS name to get the avatar URL for
   * @returns Promise resolving to the browser supported avatar URL, or null if unavailable
   */
  browserUnsupportedProtocolFallback?: (name: Name) => Promise<BrowserSupportedAssetUrl | null>;
}

/**
 * Result returned by the useAvatarUrl hook.
 *
 * Invariant: If rawAvatarUrl is null, then browserSupportedAvatarUrl must also be null.
 */
export interface UseAvatarUrlResult {
  /**
   * The original avatar text record value from ENS, before any normalization or fallback processing.
   * Null if the avatar text record is not set for the ENS name.
   */
  rawAvatarUrl: string | null;
  /**
   * A browser-supported (http/https) avatar URL ready for use in <img> tags.
   * Populated when the avatar uses http/https protocol or when a fallback successfully resolves.
   * Null if the avatar text record is not set, or if the avatar uses a non-http/https protocol
   * and either no fallback is available or the fallback fails to resolve.
   */
  browserSupportedAvatarUrl: BrowserSupportedAssetUrl | null;
  /**
   * Indicates whether the browserSupportedAvatarUrl was obtained via the fallback mechanism.
   * True if a fallback successfully resolved the URL.
   * False if the URL was used directly from the avatar text record, or if there's no avatar,
   * or if the fallback failed to resolve.
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
 * 4. Falling back to the ENS Metadata Service (which proxies decentralized storage protocols
 *    like IPFS/Arweave to browser-accessible URLs) or a custom fallback for other protocols
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
 *   if (isLoading) {
 *     return <div className="avatar-loading" />;
 *   }
 *
 *   const avatarUrl = data?.browserSupportedAvatarUrl;
 *
 *   return (
 *     <div className="avatar">
 *       {!avatarUrl ? (
 *         <div className="avatar-fallback" />
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
 *   if (isLoading) {
 *     return <div className="avatar-loading" />;
 *   }
 *
 *   const avatarUrl = data?.browserSupportedAvatarUrl;
 *
 *   return (
 *     <div className="avatar">
 *       {!avatarUrl ? (
 *         <div className="avatar-fallback" />
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

  // Create default fallback using ENS Metadata Service
  const defaultFallback = async (name: Name) => {
    return buildEnsMetadataServiceAvatarUrl(name, namespaceId!);
  };

  // Use custom fallback if provided, otherwise use default
  const activeFallback = browserUnsupportedProtocolFallback ?? defaultFallback;

  // Construct query options object
  const baseQueryOptions: {
    queryKey: readonly unknown[];
    queryFn: () => Promise<UseAvatarUrlResult>;
    retry: boolean;
    placeholderData: UseAvatarUrlResult;
  } = {
    queryKey: [
      "avatarUrl",
      name,
      _config.client.url.href,
      namespaceId,
      !!browserUnsupportedProtocolFallback,
      recordsQuery.data?.records?.texts?.avatar ?? null,
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

      // Try to parse the avatar URL
      let parsedUrl: URL;
      try {
        parsedUrl = buildUrl(avatarTextRecord);
      } catch {
        // If parsing failed, the URL is completely invalid
        return {
          rawAvatarUrl: avatarTextRecord,
          browserSupportedAvatarUrl: null,
          fromFallback: false,
        };
      }

      // If the URL uses http or https protocol, return it
      if (isHttpProtocol(parsedUrl)) {
        return {
          rawAvatarUrl: avatarTextRecord,
          browserSupportedAvatarUrl: parsedUrl,
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
    enabled:
      canEnable &&
      recordsQuery.isSuccess &&
      configQuery.isSuccess &&
      (queryOptions?.enabled ?? true),
  } as typeof baseQueryOptions;

  return useQuery<UseAvatarUrlResult, Error>(options);
}
