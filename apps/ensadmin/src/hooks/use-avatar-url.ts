"use client";

import { getNameAvatarUrl } from "@/lib/namespace-utils";
import { Name } from "@ensnode/ensnode-sdk";
import { useNamespaceId } from "./use-namespace-id";

export interface UseAvatarUrlParameters {
  name: Name;
}

export function useAvatarUrl({ name }: UseAvatarUrlParameters) {
  const { data: namespaceId, isLoading } = useNamespaceId();

  if (isLoading || !namespaceId) {
    return {
      data: null,
      isLoading: true,
    };
  }

  const avatarUrl = getNameAvatarUrl(name, namespaceId);

  return {
    data: avatarUrl,
    isLoading: false,
  };
}
