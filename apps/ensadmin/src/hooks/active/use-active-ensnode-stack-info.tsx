"use client";

import { EnsNodeStackInfo } from "@ensnode/ensnode-sdk";

import { useEnsNodeStackInfo } from "@/hooks/use-ensnode-stack-info";

/**
 * Hook to synchronously get the {@link EnsNodeStackInfo} for the active ENSNode connection.
 *
 * This hook provides synchronous access to the active {@link EnsNodeStackInfo}.
 * If no ENSNode connection is synchronously available, components using
 * this hook will throw. Components that use this hook should be a child of
 * `RequireActiveConnection` such that {@link EnsNodeStackInfo} is synchronously
 * available during render. This simplifies state in components that only make sense
 * within the context of an actively connected ENSNode.
 *
 * @returns The {@link EnsNodeStackInfo} for the active ENSNode connection
 * @throws Error if no active ENSNode connection is available
 */
export function useActiveEnsNodeStackInfo(): EnsNodeStackInfo {
  const { data } = useEnsNodeStackInfo();

  if (data === undefined) {
    throw new Error(
      `Invariant(useActiveEnsNodeStackInfo): Expected 'EnsNodeStackInfo' to be available synchronously, but it is not. Ensure that this component is a child of RequireActiveConnection.`,
    );
  }

  return data;
}
