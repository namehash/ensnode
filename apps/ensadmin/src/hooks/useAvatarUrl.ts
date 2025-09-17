"use client";

import { useNamespaceId } from "@/hooks/useNamespaceId";
import { getNameAvatarUrl } from "@/lib/namespace-utils";
import { Name } from "@ensnode/ensnode-sdk";
import { useQuery } from "@tanstack/react-query";

export interface UseAvatarUrlParameters {
  name: Name;
}

/**
 * Hook to get the URL for loading the avatar image for an ENS name through the ENS Metadata Service.
 *
 * Makes use of the ENS Metadata Service (https://metadata.ens.domains/docs) to fetch
 * the avatar image for the given name in the given namespace. The ENS Metadata Service
 * acts as proxy that offers deterministic routes for these fetch requests, and then
 * works internally to lookup the true avatar record of the provided name and namespace
 * and then to load the image associated with that true avatar record.
 *
 * @param parameters - Configuration containing the ENS name
 * @returns Query result with avatar URL, loading state, and error handling
 *
 * @example
 * ```typescript
 * import { useAvatarUrl } from "@/hooks/useAvatarUrl";
 *
 * function ProfileAvatar() {
 *   const { data: avatarUrl, isLoading, error } = useAvatarUrl({
 *     name: "vitalik.eth"
 *   });
 *
 *   if (isLoading) return <div>Loading avatar...</div>;
 *   if (error) return <div>Failed to load avatar</div>;
 *   if (!avatarUrl) return <div>No avatar set</div>;
 *
 *   return <img src={avatarUrl.toString()} alt="ENS Avatar" />;
 * }
 * ```
 */
export function useAvatarUrl({ name }: UseAvatarUrlParameters) {
  const { data: namespaceId, isLoading: namespaceLoading } = useNamespaceId();

  return useQuery({
    queryKey: ["avatarUrl", name, namespaceId],
    queryFn: () => {
      if (!namespaceId) return null;
      return getNameAvatarUrl(name, namespaceId);
    },
    enabled: !namespaceLoading && !!namespaceId,
  });
}
