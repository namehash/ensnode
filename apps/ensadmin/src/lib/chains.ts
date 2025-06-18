import { type Datasource, ENSDeployments, type L1Chain } from "@ensnode/ens-deployments";
import { type Chain } from "viem";

/**
 * Get the chain by ID based on the current ENSDeployment configuration.
 *
 * @param l1Chain - the ENSDeployment chain to get the chain for
 * @param chainId the chain ID to get the chain for
 * @returns the chain
 * @throws if the chain ID is not supported for the ENSDeployment chain
 */
export const getChainById = (l1Chain: L1Chain, chainId: number): Chain => {
  const ensDeployment = ENSDeployments[l1Chain];
  const datasources = Object.values(ensDeployment) as Array<Datasource>;
  const datasource = datasources.find((datasource) => datasource.chain.id === chainId);

  if (!datasource) {
    throw new Error(
      `The Chain ID "${chainId}" is not valid within the Datasources available under the "${l1Chain}" L1 Chain.`,
    );
  }

  return datasource.chain;
};
