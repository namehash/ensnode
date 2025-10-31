"use client";

import { useQuery } from "@tanstack/react-query";

import { buildEnsMetadataServiceAvatarUrl, type Name } from "@ensnode/ensnode-sdk";

import { useNamespace } from "./use-namespace";

export interface UseEnsMetadataServiceAvatarUrlParameters {
  name: Name;
}

/**
 * Hook to build the URL for an ENS name's avatar image that (once fetched) would load the
 * avatar image for the given name from the ENS Metadata Service
 * (https://metadata.ens.domains/docs).
 *
 * @param parameters.name - The ENS name to get the ENS Metadata Service avatar URL for
 * @returns Query result with avatarUrl, loading state, and error handling. avatarUrl will be
 *          null if there is no active ENSNode connection or if the connected ENS namespace
 *          is not supported by the ENS Metadata Service.
 *
 * @example
 * ```typescript
 * import { useEnsMetadataServiceAvatarUrl } from "@/hooks/async/use-ens-metadata-service-avatar-url";
 *
 * function ProfileAvatar() {
 *   const { data: avatarUrl, isLoading, error } = useEnsMetadataServiceAvatarUrl({
 *     name: "vitalik.eth"
 *   });
 *
 *   if (isLoading) return <div>Connecting to ENSNode...</div>;
 *   if (error) return <div>Error connecting to ENSNode</div>;
 *   if (!avatarUrl) return <div>No active ENSNode connection or no avatar URL available for the current namespace</div>;
 *
 *   return <img src={avatarUrl.toString()} alt="ENS Avatar" />;
 * }
 * ```
 */
export function useEnsMetadataServiceAvatarUrl({ name }: UseEnsMetadataServiceAvatarUrlParameters) {
  const { data: namespaceId } = useNamespace();

  return useQuery({
    queryKey: ["avatarUrl", name, namespaceId],
    queryFn: () => {
      if (namespaceId === null) throw new Error("namespaceId required to execute this query");
      return buildEnsMetadataServiceAvatarUrl(name, namespaceId);
    },
    enabled: namespaceId !== null,
  });
}
