import { ENSIndexerConfig } from "@/config/types";
import { MergedPonderConfig } from "../../ponder.config";

// Helper function to check rpc url exists for a given chain
const doesRpcUrlExistForChain = (config: ENSIndexerConfig, chainId: number): boolean => {
  return config.indexedChains[chainId]?.rpcEndpointUrl !== undefined;
};

export const validateGlobalBlockrange = (
  config: ENSIndexerConfig,
  ponderConfig: MergedPonderConfig,
): void => {
  const { globalBlockrange, ensDeploymentChain, plugins } = config;

  if (globalBlockrange.startBlock !== undefined || globalBlockrange.endBlock !== undefined) {
    const numNetworks = Object.keys(ponderConfig.networks).length;
    if (numNetworks > 1) {
      throw new Error(
        `ENSIndexer's behavior when indexing _multiple networks_ with a _specific blockrange_ is considered undefined (for now). If you're using this feature, you're likely interested in snapshotting at a specific END_BLOCK, and may have unintentially activated plugins that source events from multiple chains.
  
  The config currently is:
  ENS_DEPLOYMENT_CHAIN=${ensDeploymentChain}
  ACTIVE_PLUGINS=${Array.from(plugins).join(",")}
  START_BLOCK=${globalBlockrange.startBlock || "n/a"}
  END_BLOCK=${globalBlockrange.endBlock || "n/a"}
  
  The usage you're most likely interested in is:
    ENS_DEPLOYMENT_CHAIN=(mainnet|sepolia|holesky) ACTIVE_PLUGINS=subgraph END_BLOCK=x pnpm run start
  which runs just the 'subgraph' plugin with a specific end block, suitable for snapshotting ENSNode and comparing to Subgraph snapshots.
  
  In the future, indexing multiple networks with network-specific blockrange constraints may be possible.`,
      );
    }
  }
};

/**
 * Validates the chain configurations in the config and ponder config to ensure that the
 * indexer has the necessary configuration to index the chains it is configured to index.
 *
 * For each plugin, the indexer will attempt to source events from the chains it is configured to index.
 * This function ensures that the RPC_URL_* environment variables are defined for each chain the indexer
 * is configured to index.
 */
export const validateChainConfigs = (
  config: ENSIndexerConfig,
  ponderConfig: MergedPonderConfig,
): void => {
  const { plugins } = config;

  const allChainIds = Object.values(ponderConfig.networks).map((network) => network.chainId);

  if (!allChainIds.every((chainId) => doesRpcUrlExistForChain(config, chainId))) {
    throw new Error(
      `ENSNode has been configured with the following ACTIVE_PLUGINS: ${Array.from(plugins).join(
        ", ",
      )}.
    These plugins, collectively, index events from the following chains: ${allChainIds.join(", ")}.
    
    The following RPC_URL_* environment variables must be defined for nominal indexing behavior:
    ${allChainIds
      .map(
        (chainId) =>
          `RPC_URL_${chainId}: ${config.indexedChains[chainId]?.rpcEndpointUrl || "N/A"}`,
      )
      .join("\n    ")}
    `,
    );
  }
};

export function validateConfig(config: ENSIndexerConfig, ponderConfig: MergedPonderConfig) {
  ////////
  // Invariant: All configured networks must have a custom RPC endpoint provided. Public RPC endpoints
  // will ratelimit and make indexing more or less unusable.
  ////////
  validateChainConfigs(config, ponderConfig);

  ////////
  // Invariant: if using a custom START_BLOCK or END_BLOCK, ponder should be configured to index at
  // most one network.
  ////////
  validateGlobalBlockrange(config, ponderConfig);
}
