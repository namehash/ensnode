import DeploymentConfigs, {
  ENSDeploymentChain,
  SubregistryDeploymentConfig,
  SubregistryName,
} from "@ensnode/ens-deployments";
import { BlockInfo, NetworkIndexingStatus } from "@ensnode/ponder-metadata";
import { EnsNode } from "./types";

/**
 * Selects the chain ID of selected ENS Deployment Chain from ENSNode metadata.
 *
 * @param ensNodeMetadata ENSNode metadata
 * @returns The indexed chain ID or null if the status is not available.
 */
export function selectEnsDeploymentChain(ensNodeMetadata: EnsNode.Metadata): ENSDeploymentChain {
  return ensNodeMetadata.env.ENS_DEPLOYMENT_CHAIN;
}
/**
 * Selects ENS Subregistry configuration extracted from ENSNode metadata by its name.
 *
 * @param ensNodeMetadata ENSNode metadata
 * @param subregistryName Subregistry name
 * @returns ENS Subregistry configuration
 */
export function selectEnsSubregistryConfig(
  ensNodeMetadata: EnsNode.Metadata,
  subregistryName: SubregistryName = "eth",
): SubregistryDeploymentConfig {
  const ensDeploymentChain = selectEnsDeploymentChain(ensNodeMetadata);

  return ensDeploymentChain === "mainnet"
    ? DeploymentConfigs[ensDeploymentChain][subregistryName]
    : DeploymentConfigs[ensDeploymentChain]["eth"];
}

interface SelectIndexedNetworkBlockProps {
  blockName: keyof NetworkIndexingStatus;
  chainId: number;
  ensNodeMetadata: EnsNode.Metadata;
}

/**
 * Selects the indexed network block from ENSNode metadata by its chain ID and block name.
 *
 * @param blockName Block name
 * @param chainId Chain ID
 * @param ensNodeMetadata ENSNode metadata
 * @returns The indexed network block
 */
export function selectIndexedNetworkBlock({
  blockName,
  chainId,
  ensNodeMetadata,
}: SelectIndexedNetworkBlockProps): BlockInfo {
  const networkIndexingStatus = ensNodeMetadata.runtime.networkIndexingStatusByChainId[chainId];

  if (!networkIndexingStatus) {
    throw new Error(`Could not find network indexing status for '${chainId}' chain ID`);
  }

  if (!networkIndexingStatus[blockName]) {
    throw new Error(
      `Could not find network indexing status for '${chainId}' chain ID and '${blockName}' block name`,
    );
  }

  return networkIndexingStatus[blockName];
}
