import { useENSIndexerConfig } from "@ensnode/ensnode-react";

/**
 * Hook to get the namespace ID from the active ENSNode connection.
 *
 * @returns Query result with namespaceId, loading state, and error handling. namespaceId will
 *          be null if there is no active ENSNode connection.
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
