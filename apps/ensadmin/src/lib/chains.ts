import { Datasource, type L1Chain, getDatasources } from "@ensnode/datasources";
import { type Chain } from "viem";

/**
 * Get a chain object by ID within the context of a specific ENS namespace (identified by L1Chain).
 *
 * @param l1Chain - the L1Chain identifying which ENS namespace to query within
 * @param chainId the chain ID
 * @returns the viem#Chain object
 * @throws if the chain ID is not supported within the selected ENS namespace
 */
export const getChainById = (l1Chain: L1Chain, chainId: number): Chain => {
  const datasources = Object.values(getDatasources(l1Chain)) as Datasource[];
  const datasource = datasources.find((datasource) => datasource.chain.id === chainId);

  if (!datasource) {
    throw new Error(
      `The Chain ID "${chainId}" is not valid within the Datasources available under the "${l1Chain}" L1 Chain.`,
    );
  }

  return datasource.chain;
};
