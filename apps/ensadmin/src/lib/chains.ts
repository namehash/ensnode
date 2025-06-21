import { Datasource, type ENSNamespace, getDatasources } from "@ensnode/datasources";
import { type Chain } from "viem";

/**
 * Get a chain object by ID within the context of a specific ENS namespace.
 *
 * @param namespace - the ENS namespace identifier within which to find a chain
 * @param chainId the chain ID
 * @returns the viem#Chain object
 * @throws if no Datasources are defined for chainId within the selected ENS namespace
 */
export const getChainById = (namespace: ENSNamespace, chainId: number): Chain => {
  const datasources = Object.values(getDatasources(namespace)) as Datasource[];
  const datasource = datasources.find((datasource) => datasource.chain.id === chainId);

  if (!datasource) {
    throw new Error(
      `No Datasources within the "${namespace}" ENS namespace are defined for Chain ID "${chainId}".`,
    );
  }

  return datasource.chain;
};
