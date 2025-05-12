import { type Datasource, type ENSDeploymentChain, ENSDeployments } from "@ensnode/ens-deployments";
import { type Chain } from "viem";

/**
 * Get the chain by ID based on the current ENSDeployment configuration.
 *
 * @param ensDeploymentChain - the ENSDeployment chain to get the chain for
 * @param chainId the chain ID to get the chain for
 * @returns the chain
 * @throws if the chain ID is not supported for the ENSDeployment chain
 */
export const getChainById = (ensDeploymentChain: ENSDeploymentChain, chainId: number): Chain => {
  const ensDeployment = ENSDeployments[ensDeploymentChain];
  const datasources = Object.values(ensDeployment) as Array<Datasource>;
  const datasource = datasources.find((datasource) => datasource.chain.id === chainId);

  if (!datasource) {
    throw new Error(
      `Chain ID "${chainId}" is not supported for the "${ensDeploymentChain}" ENS Deployment Chain`,
    );
  }

  return datasource.chain;
};
