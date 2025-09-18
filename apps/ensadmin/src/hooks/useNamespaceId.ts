import { useENSIndexerConfig } from "@ensnode/ensnode-react";

/**
 * Hook to get the namespace ID from the active ENSNode connection.
 *
 * Returns the ENS namespace identifier for the currently connected ENSNode client.
 * This determines which ENS namespace (Mainnet, Sepolia, Holesky, etc.) the connected ENSNode
 * is associated with. Returns null if no ENSNode is actively connected.
 *
 * @returns Query result with namespace ID, loading state, and error handling
 *
 * @example
 * ```typescript
 * import { useNamespaceId } from "@/hooks/useNamespaceId";
 *
 * function NamespaceIndicator() {
 *   const { data: namespaceId, isLoading, error } = useNamespaceId();
 *
 *   if (isLoading) return <div>Connecting to ENSNode...</div>;
 *   if (error) return <div>Error connecting to ENSNode</div>;
 *   if (!namespaceId) return <div>No active ENSNode connection</div>;
 *
 *   return <div>Connected to ENS namespace: {namespaceId}</div>;
 * }
 * ```
 */
export function useNamespaceId() {
  const configQuery = useENSIndexerConfig();

  return {
    ...configQuery,
    data: configQuery.data?.namespace ?? null,
  };
}
