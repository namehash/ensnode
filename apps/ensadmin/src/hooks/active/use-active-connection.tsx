"use client";

import { useENSIndexerConfig } from "@ensnode/ensnode-react";

/**
 * Hook to get the currently active ENSNode connection synchronously.
 *
 * This hook provides synchronous access to the active ENSNode connection.
 * If no ENSNode connection is synchronouslly available, components using
 * this hook will throw. Components that use this hook should be a child of
 * `RequireActiveConnection` such that the connected ENSNode's config is synchronously
 * available during render. This simplifies state in components that only make sense
 * within the context of an actively connected ENSNode.
 *
 * @returns The active ENSNode connection (currently only the ENSIndexer config)
 * @throws Error if no active ENSNode connection is available
 */
export function useActiveConnection() {
  const { data } = useENSIndexerConfig();

  if (data === undefined) {
    throw new Error(`Invariant(useActiveConnection): Expected an active ENSNode Config`);
  }

  return data;
}
