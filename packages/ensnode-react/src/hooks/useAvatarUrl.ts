"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";

import {
  type BrowserSupportedAssetUrl,
  type BrowserSupportedAssetUrlProxy,
  buildBrowserSupportedAvatarUrl,
  type ENSNamespaceId,
  ENSNamespaceIds,
  type Name,
} from "@ensnode/ensnode-sdk";

import type { QueryParameter, WithSDKConfigParameter } from "../types";
import { useENSNodeConfig } from "./useENSNodeConfig";
import { useENSNodeSDKConfig } from "./useENSNodeSDKConfig";
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
    WithSDKConfigParameter {
  /**
   * If null, the query will not be executed.
   */
  name: Name | null;
  /**
   * Optional function to build a BrowserSupportedAssetUrl for a name's avatar image
   *  when the avatar text record uses a non-browser-supported protocol (e.g., ipfs://, ar://, eip155:/).
   *
   * If undefined, defaults to using the ENS Metadata Service as a proxy for browser-supported avatar urls.
   *
   * IMPORTANT: Custom implementations MUST use `toBrowserSupportedUrl()` to create BrowserSupportedAssetUrl values,
   * or return the result from `buildEnsMetadataServiceAvatarUrl()`. The returned URL is validated at runtime
   * to ensure it passes the `isBrowserSupportedProtocol` check (http, https, or data protocols).
   *
   * @param name - The ENS name to get the browser supported avatar URL for
   * @param avatarUrl - The avatar URL parsed as a URL object, allowing protocol-specific logic (e.g., ipfs:// vs ar://)
   * @param namespaceId - The ENS namespace identifier for the name
   * @returns The browser supported avatar URL, or null if unavailable
   */
  browserSupportedAvatarUrlProxy?: BrowserSupportedAssetUrlProxy;
}

/**
 * Result returned by the useAvatarUrl hook.
 *
 * Invariant: If rawAvatarTextRecord is null, then browserSupportedAvatarUrl must also be null.
 */
export interface UseAvatarUrlResult {
  /**
   * The original avatar text record value from ENS, before any normalization or proxy processing.
   * Null if the avatar text record is not set for the ENS name.
   */
  rawAvatarTextRecord: string | null;
  /**
   * A browser-supported (http/https/data) avatar URL ready for use in <img> tags.
   * Populated when the rawAvatarTextRecord is a valid URL that uses a browser-supported protocol (http, https, or data) or when a url is available to load the avatar using a proxy.
   * Null if the avatar text record is not set, if the avatar text record is malformed/invalid,
   * or if the avatar uses a non-browser-supported protocol and no url is known for how to load the avatar using a proxy.
   */
  browserSupportedAvatarUrl: BrowserSupportedAssetUrl | null;
  /**
   * Indicates whether the browserSupportedAvatarUrl uses a proxy service.
   * True if the url uses a proxy (either the default ENS Metadata Service or a custom proxy).
   * False if the URL comes directly from the avatar text record, or if there's no avatar text record,
   * or if the avatar text record has an invalid format, or if no url is known for loading the avatar using a proxy.
   */
  usesProxy: boolean;
}

/**
 * Resolves the avatar URL for an ENS name.
 *
 * This hook attempts to get the avatar URL by:
 * 1. Fetching the avatar text record using useRecords
 * 2. Normalizing the avatar text record as a URL
 * 3. Returning the URL if it uses a browser-supported protocol (http, https, or data)
 * 4. For valid URLs with non-browser-supported protocols (e.g., ipfs://, ar://), using the ENS Metadata Service
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
 * // With custom IPFS gateway proxy
 * import { useAvatarUrl, toBrowserSupportedUrl, defaultBrowserSupportedAssetUrlProxy } from "@ensnode/ensnode-sdk";
 *
 * function ProfileAvatar({ name }: { name: string }) {
 *   const { data, isLoading } = useAvatarUrl({
 *     name,
 *     browserSupportedAvatarUrlProxy: (name, avatarUrl, namespaceId) => {
 *       // Handle IPFS protocol URLs with a custom gateway
 *       if (avatarUrl.protocol === 'ipfs:') {
 *         // Extract CID and optional path from ipfs://{CID}/{path}
 *         const ipfsPath = avatarUrl.href.replace('ipfs://', '');
 *
 *         // Use ipfs.io public gateway (best-effort, not for production)
 *         return toBrowserSupportedUrl(`https://ipfs.io/ipfs/${ipfsPath}`);
 *
 *         // Or use your own gateway:
 *         // return toBrowserSupportedUrl(`https://my-gateway.example.com/ipfs/${ipfsPath}`);
 *       }
 *
 *       // Handle Arweave protocol
 *       if (avatarUrl.protocol === 'ar:') {
 *         const arweaveId = avatarUrl.href.replace('ar://', '');
 *         return toBrowserSupportedUrl(`https://arweave.net/${arweaveId}`);
 *       }
 *
 *       // For other protocols, fall back to the ENS Metadata Service
 *       return defaultBrowserSupportedAssetUrlProxy(name, avatarUrl, namespaceId);
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
  parameters: UseAvatarUrlParameters,
): UseQueryResult<UseAvatarUrlResult, Error> {
  const { name, config, query: queryOptions, browserSupportedAvatarUrlProxy } = parameters;
  const _config = useENSNodeSDKConfig(config);

  const canEnable = name !== null;

  const recordsQuery = useRecords({
    name,
    selection: { texts: [AVATAR_TEXT_RECORD_KEY] },
    config: _config,
    query: { enabled: canEnable },
  });

  const configQuery = useENSNodeConfig({ config: _config });

  // Construct query options object
  const baseQueryOptions: {
    queryKey: readonly unknown[];
    queryFn: () => Promise<UseAvatarUrlResult>;
    retry: boolean;
  } = {
    queryKey: [
      "avatarUrl",
      name,
      _config.client.url.href,
      configQuery.data?.ensIndexerPublicConfig?.namespace,
      !!browserSupportedAvatarUrlProxy,
      recordsQuery.data?.records?.texts?.avatar ?? null,
    ] as const,
    queryFn: async (): Promise<UseAvatarUrlResult> => {
      if (!name || !recordsQuery.data || !configQuery.data) {
        return {
          rawAvatarTextRecord: null,
          browserSupportedAvatarUrl: null,
          usesProxy: false,
        };
      }

      const namespaceId: ENSNamespaceId =
        configQuery.data.ensIndexerPublicConfig?.namespace ?? ENSNamespaceIds.Mainnet;

      const rawAvatarTextRecord = recordsQuery.data.records?.texts?.avatar ?? null;

      const result = buildBrowserSupportedAvatarUrl(
        rawAvatarTextRecord,
        name,
        namespaceId,
        browserSupportedAvatarUrlProxy,
      );

      return {
        rawAvatarTextRecord: result.rawAssetTextRecord,
        browserSupportedAvatarUrl: result.browserSupportedAssetUrl,
        usesProxy: result.usesProxy,
      };
    },
    retry: false,
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
