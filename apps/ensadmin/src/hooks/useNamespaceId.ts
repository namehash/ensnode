import { ENSNamespaceIds } from "@ensnode/datasources";
import { useENSIndexerConfig } from "@ensnode/ensnode-react";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to get the namespace ID from the active ENSNode connection.
 *
 * Returns the ENS namespace identifier for the currently configured ENSNode client.
 * This determines which ENS network (Mainnet, Sepolia, Holesky, etc.) the application
 * is connected to. Falls back to Mainnet if no configuration is available.
 *
 * @returns Query result with namespace ID, loading state, and error handling
 *
 * @example
 * ```typescript
 * import { useNamespaceId } from "@/hooks/useNamespaceId";
 * import { ENSNamespaceIds } from "@ensnode/datasources";
 *
 * function NetworkIndicator() {
 *   const { data: namespaceId, isLoading, error } = useNamespaceId();
 *
 *   if (isLoading) return <div>Loading network...</div>;
 *   if (error) return <div>Failed to detect network</div>;
 *
 *   const networkName = namespaceId === ENSNamespaceIds.Mainnet ? "Mainnet" :
 *                      namespaceId === ENSNamespaceIds.Sepolia ? "Sepolia" : "Unknown";
 *
 *   return <div>Connected to: {networkName}</div>;
 * }
 * ```
 */
export function useNamespaceId() {
  const { data: config, isLoading: configLoading, error: configError } = useENSIndexerConfig();

  return useQuery({
    queryKey: ["namespaceId", config?.namespace],
    queryFn: () => config?.namespace ?? ENSNamespaceIds.Mainnet,
    enabled: !configLoading,
    initialData: ENSNamespaceIds.Mainnet,
  });
}
