"use client";

import { useAvailableENSNodeConnections } from "@/hooks/ensnode-connections";

/**
 * Hook to get the currently selected ENSNode connection URL synchronously.
 *
 * This hook provides synchronous access to the URL of the currently selected ENSNode.
 * If the selected ENSNode's Config is not synchronously available, components using
 * this hook will throw. Components that use this hook should be a child of
 * RequireActiveENSNodeConfig such that the selected ENSNode's config is synchronously
 * available during render. This simplifies state in components that only make sense
 * within the context of a selected ENSNode.
 *
 * @returns The selected ENSNode connection URL
 * @throws Error if no selected ENSNode Connection is available
 */
export function useSelectedENSNodeUrl() {
  const { selectedConnection } = useAvailableENSNodeConnections();

  if (!selectedConnection) {
    throw new Error(`Invariant(useSelectedENSNodeUrl): Expected a selected ENSNode Connection.`);
  }

  return selectedConnection;
}
