"use client";

import {
  type BrowserSupportedAssetUrl,
  type Name,
  buildEnsMetadataServiceAvatarUrl,
  buildUrl,
  isHttpProtocol,
  toBrowserSupportedUrl,
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
export interface UseAvatarUrlParameters
  extends QueryParameter<string | null>,
    ConfigParameter {
  /**
   * If null, the query will not be executed.
   */
  name: Name | null;
  /**
   * Optional custom proxy function to get avatar URL when the avatar text record
   * uses a non-http/https protocol (e.g., ipfs://, ar://, eip155:/).
   *
   * If undefined, defaults to using the ENS Metadata Service as a proxy for browser-supported avatar urls.
   *
   * IMPORTANT: Custom implementations MUST use `toBrowserSupportedUrl()` to create BrowserSupportedAssetUrl values,
   * or return the result from `buildEnsMetadataServiceAvatarUrl()`. The returned URL is validated at runtime
   * to ensure it passes the `isHttpProtocol` check.
   *
   * @param name - The ENS name to get the browser supported avatar URL for
   * @param rawAvatarUrl - The original avatar text record value, allowing protocol-specific logic (e.g., ipfs:// vs ar://)
   * @returns The browser supported avatar URL, or null if unavailable
   */
  browserSupportedAvatarUrlProxy?: (
    name: Name,
    rawAvatarUrl: string
  ) => BrowserSupportedAssetUrl | null;
}

/**
 * Result returned by the useAvatarUrl hook.
 *
 * Invariant: If rawAvatarUrl is null, then browserSupportedAvatarUrl must also be null.
 */
export interface UseAvatarUrlResult {
  /**
   * The original avatar text record value from ENS, before any normalization or proxy processing.
   * Null if the avatar text record is not set for the ENS name.
   */
  rawAvatarUrl: string | null;
  /**
   * A browser-supported (http/https) avatar URL ready for use in <img> tags.
   * Populated when the avatar uses http/https protocol or when a proxy successfully resolves it.
   * Null if the avatar text record is not set, if the avatar text record is malformed/invalid,
   * or if the avatar uses a non-http/https protocol and either no proxy is available or the proxy fails to resolve it.
   */
  browserSupportedAvatarUrl: BrowserSupportedAssetUrl | null;
  /**
   * Indicates whether the browserSupportedAvatarUrl was obtained via a proxy service.
   * True if a proxy (either the default ENS Metadata Service or a custom proxy) successfully resolved the URL.
   * False if the URL was used directly from the avatar text record, or if there's no avatar,
   * or if the proxy failed to resolve.
   */
  usesProxy: boolean;
}

/**
 * Resolves the avatar URL for an ENS name.
 *
 * This hook attempts to get the avatar URL by:
 * 1. Fetching the avatar text record using useRecords
 * 2. Normalizing the avatar text record as a URL
 * 3. Returning the URL if it uses http or https protocol
 * 4. For valid URLs with unsupported protocols (e.g., ipfs://, ar://), using the ENS Metadata Service
 *    (or a custom proxy) to convert them to browser-accessible URLs
 * 5. For malformed/invalid URLs, returning null without attempting proxy conversion
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
 *   if (isLoading || !data) {
 *     return <div className="avatar-loading" />;
 *   }
 *
 *   return (
 *     <div className="avatar">
 *       {!data.browserSupportedAvatarUrl ? (
 *         <div className="avatar-fallback" />
 *       ) : (
 *         <img src={data.browserSupportedAvatarUrl.toString()} alt={`${name} avatar`} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With custom proxy
 * import { useAvatarUrl, toBrowserSupportedUrl } from "@ensnode/ensnode-react";
 *
 * function ProfileAvatar({ name }: { name: string }) {
 *   const { data, isLoading } = useAvatarUrl({
 *     name,
 *     browserSupportedAvatarUrlProxy: (name, rawAvatarUrl) => {
 *       // Use your own custom IPFS gateway
 *       if (rawAvatarUrl.startsWith('ipfs://')) {
 *         const ipfsHash = rawAvatarUrl.replace('ipfs://', '');
 *         return toBrowserSupportedUrl(`https://my-gateway.io/ipfs/${ipfsHash}`);
 *       }
 *       return null;
 *     }
 *   });
 *
 *   if (isLoading || !data) {
 *     return <div className="avatar-loading" />;
 *   }
 *
 *   return (
 *     <div className="avatar">
 *       {!data.browserSupportedAvatarUrl ? (
 *         <div className="avatar-fallback" />
 *       ) : (
 *         <img src={data.browserSupportedAvatarUrl.toString()} alt={`${name} avatar`} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAvatarUrl(
  parameters: UseAvatarUrlParameters
): UseQueryResult<UseAvatarUrlResult, Error> {
  const {
    name,
    config,
    query: queryOptions,
    browserSupportedAvatarUrlProxy,
  } = parameters;
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
      configQuery.data?.namespace,
      !!browserSupportedAvatarUrlProxy,
      recordsQuery.data?.records?.texts?.avatar ?? null,
    ] as const,
    queryFn: async (): Promise<UseAvatarUrlResult> => {
      if (!name || !recordsQuery.data || !configQuery.data) {
        return {
          rawAvatarUrl: null,
          browserSupportedAvatarUrl: null,
          usesProxy: false,
        };
      }

      // Invariant: configQuery.data.namespace is guaranteed to be defined when configQuery.data exists
      const namespaceId = configQuery.data.namespace;

      const avatarTextRecord = recordsQuery.data.records?.texts?.avatar ?? null;

      // If no avatar text record, return null values
      if (!avatarTextRecord) {
        return {
          rawAvatarUrl: null,
          browserSupportedAvatarUrl: null,
          usesProxy: false,
        };
      }

      try {
        const browserSupportedUrl = toBrowserSupportedUrl(avatarTextRecord);

        return {
          rawAvatarUrl: avatarTextRecord,
          browserSupportedAvatarUrl: browserSupportedUrl,
          usesProxy: false,
        };
      } catch {
        // toBrowserSupportedUrl failed - could be unsupported protocol or malformed URL
        // Try to parse as a general URL to determine which case we're in
        try {
          buildUrl(avatarTextRecord);
          // buildUrl succeeded, so the avatar text record is a valid URL with an unsupported protocol
          // Continue to proxy handling below
        } catch {
          // buildUrl failed, so the avatar text record is malformed/invalid
          // Skip proxy logic and return null
          return {
            rawAvatarUrl: avatarTextRecord,
            browserSupportedAvatarUrl: null,
            usesProxy: false,
          };
        }
      }

      // Default proxy is to use the ENS Metadata Service
      const defaultProxy = (
        name: Name,
        rawAvatarUrl: string
      ): BrowserSupportedAssetUrl | null => {
        return buildEnsMetadataServiceAvatarUrl(name, namespaceId);
      };

      // Use custom proxy if provided, otherwise use default
      const activeProxy: (
        name: Name,
        rawAvatarUrl: string
      ) => BrowserSupportedAssetUrl | null =
        browserSupportedAvatarUrlProxy ?? defaultProxy;

      // For other protocols (ipfs, data, NFT URIs, etc.), use proxy if available
      if (activeProxy) {
        try {
          const proxyUrl = activeProxy(name, avatarTextRecord);

          // Invariant: BrowserSupportedAssetUrl must pass isHttpProtocol check
          if (proxyUrl !== null && !isHttpProtocol(proxyUrl)) {
            throw new Error(
              `browserSupportedAvatarUrlProxy returned a URL with unsupported protocol: ${proxyUrl.protocol}. BrowserSupportedAssetUrl must use http or https protocol.`
            );
          }

          return {
            rawAvatarUrl: avatarTextRecord,
            browserSupportedAvatarUrl: proxyUrl,
            usesProxy: proxyUrl !== null,
          };
        } catch {
          return {
            rawAvatarUrl: avatarTextRecord,
            browserSupportedAvatarUrl: null,
            usesProxy: false,
          };
        }
      }

      // No fallback available
      return {
        rawAvatarUrl: avatarTextRecord,
        browserSupportedAvatarUrl: null,
        usesProxy: false,
      };
    },
    retry: false,
    placeholderData: {
      rawAvatarUrl: null,
      browserSupportedAvatarUrl: null,
      usesProxy: false,
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
