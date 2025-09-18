"use client";

import { useNamespaceId } from "@/hooks/useNamespaceId";
import { buildEnsMetadataServiceAvatarUrl } from "@/lib/namespace-utils";
import { Name } from "@ensnode/ensnode-sdk";
import { useQuery } from "@tanstack/react-query";

export interface UseEnsMetadataServiceAvatarUrlParameters {
  name: Name;
}

/**
 * Hook to build the URL for an ENS name's avatar image that (once fetched) would load the
 * avatar image for the given name from the ENS Metadata Service
 * (https://metadata.ens.domains/docs).
 *
 * The returned URL is dynamically built based on the ENS namespace of the actively
 * connected ENSNode. Not all ENS namespaces are supported by the ENS Metadata Service.
 * Therefore, the returned avatarUrl may be null.
 *
 * @param parameters - The ENS name to get the avatar URL for
 * @returns Query result with avatar URL (or null), loading state, and error handling
 *
 * @example
 * ```typescript
 * import { useEnsMetadataServiceAvatarUrl } from "@/hooks/useEnsMetadataServiceAvatarUrl";
 *
 * function ProfileAvatar() {
 *   const { data: avatarUrl, isLoading, error } = useEnsMetadataServiceAvatarUrl({
 *     name: "vitalik.eth"
 *   });
 *
 *   if (isLoading) return <div>Constructing avatar URL...</div>;
 *   if (error) return <div>Failed to construct avatar URL</div>;
 *   if (!avatarUrl) return <div>No avatar URL available for the current namespace</div>;
 *
 *   return <img src={avatarUrl.toString()} alt="ENS Avatar" />;
 * }
 * ```
 */
export function useEnsMetadataServiceAvatarUrl({ name }: UseEnsMetadataServiceAvatarUrlParameters) {
  const { data: namespaceId } = useNamespaceId();

  return useQuery({
    queryKey: ["avatarUrl", name, namespaceId],
    queryFn: () => {
      if (!namespaceId) return null;
      return buildEnsMetadataServiceAvatarUrl(name, namespaceId);
    },
    enabled: !!namespaceId,
  });
}
