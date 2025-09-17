"use client";

import { useNamespaceId } from "@/hooks/useNamespaceId";
import { getNameAvatarUrl } from "@/lib/namespace-utils";
import { Name } from "@ensnode/ensnode-sdk";
import { useQuery } from "@tanstack/react-query";

export interface UseAvatarUrlParameters {
  name: Name;
}

/**
 * Hook to build the URL for an ENS name's avatar image via the ENS Metadata Service.
 *
 * Constructs a URL pointing to the ENS Metadata Service (https://metadata.ens.domains/docs)
 * for the given name in the given namespace. This URL can then be used in fetch operations
 * or as an image src to load the avatar associated with the ENS name.
 *
 * @param parameters - Configuration containing the ENS name
 * @returns Query result with avatar URL (or null), loading state, and error handling
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
 *   if (isLoading) return <div>Constructing avatar URL...</div>;
 *   if (error) return <div>Failed to fetch avatar URL</div>;
 *
 *   return <img src={avatarUrl.toString()} alt="ENS Avatar" />;
 * }
 * ```
 */
export function useAvatarUrl({ name }: UseAvatarUrlParameters) {
  const { data: namespaceId } = useNamespaceId();

  return useQuery({
    queryKey: ["avatarUrl", name, namespaceId],
    queryFn: () => {
      if (!namespaceId) return null;
      return getNameAvatarUrl(name, namespaceId);
    },
    enabled: !!namespaceId,
  });
}
