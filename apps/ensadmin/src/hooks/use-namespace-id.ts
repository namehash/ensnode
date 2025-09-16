import { ENSNamespaceIds } from "@ensnode/datasources";
import { useENSIndexerConfig } from "@ensnode/ensnode-react";

/**
 * Hook to get the namespace ID from the active ENSNode connection
 */
export function useNamespaceId() {
  const { data: config, ...rest } = useENSIndexerConfig();

  return {
    data: config?.namespace ?? ENSNamespaceIds.Mainnet,
    ...rest,
  };
}
