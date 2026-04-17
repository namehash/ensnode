"use client";

import { useEnsApiPublicConfig } from "@/components/config/use-ens-api-public-config";

/**
 * Hook to get the currently active ENSNode Config synchronously.
 *
 * This hook provides synchronous access to the active ENSNode connection.
 * If no ENSNode connection is synchronously available, components using
 * this hook will throw. Components that use this hook should be a child of
 * `RequireActiveConnection` such that the connected ENSNode's config is synchronously
 * available during render. This simplifies state in components that only make sense
 * within the context of an actively connected ENSNode.
 *
 * @returns The active ENSNode connection (currently only the ENSIndexer config)
 * @throws Error if no active ENSNode connection is available
 */
export function useActiveENSNodeConfig() {
  const { data } = useEnsApiPublicConfig();

  if (data === undefined) {
    throw new Error(`Invariant(useActiveENSNodeConfig): Expected an active ENSNode Config`);
  }

  return data;
}
