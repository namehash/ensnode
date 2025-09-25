"use client";

import { useENSNodeConnections } from "@/hooks/ensnode-connections";

/**
 * Hook to get the currently active ENSNode connection URL synchronously.
 *
 * This hook provides synchronous access to the URL of the currently connected ENSNode.
 * If the connected ENSNode's Config is not synchronously available, components using
 * this hook will throw. Components that use this hook should be a child of
 * RequireActiveENSNodeConfig such that the connected ENSNode's config is synchronously
 * available during render. This simplifies state in components that only make sense
 * within the context of a connected ENSNode.
 *
 * @returns The active ENSNode connection URL
 * @throws Error if no active ENSNode Connection is available
 */
export function useActiveENSNodeUrl() {
  const { active } = useENSNodeConnections();

  if (!active) {
    throw new Error(`Invariant(useActiveENSNodeUrl): Expected an active ENSNode Connection.`);
  }

  return active;
}
