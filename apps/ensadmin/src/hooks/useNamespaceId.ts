import { ENSNamespaceIds } from "@ensnode/datasources";
import { useENSIndexerConfig } from "@ensnode/ensnode-react";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to get the namespace ID from the active ENSNode connection.
 *
 * Returns the ENS namespace identifier for the currently configured ENSNode client.
 * This determines which ENS namespace (Mainnet, Sepolia, Holesky, etc.) the connected ENSNode
 * is associated with. Falls back to Mainnet if no ENSNode is actively connected.
 *
 * @returns Query result with namespace ID, loading state, and error handling
 *
 * @example
 * ```typescript
 * import { useNamespaceId } from "@/hooks/useNamespaceId";
 * import { ENSNamespaceIds } from "@ensnode/datasources";
 *
 * function NamespaceIndicator() {
 *   const { data: namespaceId, isLoading, error } = useNamespaceId();
 *
 *   if (isLoading) return <div>Connecting to ENSNode...</div>;
 *   if (error) return <div>Error connecting to ENSNode</div>;
 *
 *   const namespaceName = namespaceId === ENSNamespaceIds.Mainnet ? "Mainnet" :
 *                         namespaceId === ENSNamespaceIds.Sepolia ? "Sepolia" : "Unknown";
 *
 *   return <div>Connected to: {namespaceName}</div>;
 * }
 * ```
 */
export function useNamespaceId() {
  const { data: config, isLoading: configLoading } = useENSIndexerConfig();

  return useQuery({
    queryKey: ["namespaceId", config?.namespace],
    queryFn: () => config?.namespace ?? ENSNamespaceIds.Mainnet,
    enabled: !configLoading,
    initialData: ENSNamespaceIds.Mainnet,
  });
}
