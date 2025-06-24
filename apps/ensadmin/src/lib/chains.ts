import { Datasource, type ENSNamespaceId, getENSNamespace } from "@ensnode/datasources";
import { type Chain } from "viem";

/**
 * Get a chain object by ID within the context of a specific namespace.
 *
 * @param namespaceId - the namespace identifier within which to find a chain
 * @param chainId the chain ID
 * @returns the viem#Chain object
 * @throws if no Datasources are defined for chainId within the selected namespace
 */
export const getChainById = (namespaceId: ENSNamespaceId, chainId: number): Chain => {
  const datasources = Object.values(getENSNamespace(namespaceId)) as Datasource[];
  const datasource = datasources.find((datasource) => datasource.chain.id === chainId);

  if (!datasource) {
    throw new Error(
      `No Datasources within the "${namespaceId}" namespace are defined for Chain ID "${chainId}".`,
    );
  }

  return datasource.chain;
};
