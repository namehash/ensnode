"use client";

import { useENSIndexerConfig } from "@ensnode/ensnode-react";

/**
 * Hook to get the currently active ENSNode configuration synchronously.
 *
 * This hook provides synchronous access to the connected ENSNode's configuration.
 * If the connected ENSNode's Config is not synchronously available, components using
 * this hook will throw. Components that use this hook should be a child of
 * RequireActiveENSNodeConfig such that the connected ENSNode's config is synchronously
 * available during render. This simplifies state in components that only make sense
 * within the context of a connected ENSNode.
 *
 * @returns The active ENSNode configuration
 * @throws Error if no active ENSNode Config is available
 */
export function useActiveENSNodeConfig() {
  const { data } = useENSIndexerConfig();

  if (data === undefined) {
    throw new Error(`Invariant(useActiveENSNodeConfig): Expected an active ENSNode Config`);
  }

  return data;
}
