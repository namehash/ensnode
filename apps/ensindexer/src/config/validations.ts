import { getConfig, rpcEndpointUrl } from "@/config/app-config";
import { MergedPluginConfig } from "@/plugins";

export const validateGlobalBlockrange = (
  networks: MergedPluginConfig["networks"],
  requestedPluginNames: string[],
): void => {
  const { globalBlockrange, ensDeploymentChain } = getConfig();

  if (globalBlockrange.startBlock !== undefined || globalBlockrange.endBlock !== undefined) {
    const numNetworks = Object.keys(networks).length;
    if (numNetworks > 1) {
      throw new Error(
        `ENSIndexer's behavior when indexing _multiple networks_ with a _specific blockrange_ is considered undefined (for now). If you're using this feature, you're likely interested in snapshotting at a specific END_BLOCK, and may have unintentially activated plugins that source events from multiple chains.
  
  The config currently is:
  ENS_DEPLOYMENT_CHAIN=${ensDeploymentChain}
  ACTIVE_PLUGINS=${requestedPluginNames.join(",")}
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

export const validateChainConfigs = (
  allChainIds: number[],
  requestedPluginNames: string[],
): void => {
  if (!allChainIds.every((chainId) => rpcEndpointUrl(chainId) !== undefined)) {
    throw new Error(`ENSNode has been configured with the following ACTIVE_PLUGINS: ${requestedPluginNames.join(
      ", ",
    )}.
    These plugins, collectively, index events from the following chains: ${allChainIds.join(", ")}.
    
    The following RPC_URL_* environment variables must be defined for nominal indexing behavior:
    ${allChainIds
      .map((chainId) => `RPC_URL_${chainId}: ${rpcEndpointUrl(chainId) || "N/A"}`)
      .join("\n")}
    `);
  }
};

export function validateConfig(allChainIds: number[], networks: MergedPluginConfig["networks"]) {
  const { requestedPluginNames } = getConfig();

  ////////
  // Invariant: All configured networks must have a custom RPC endpoint provided. Public RPC endpoints
  // will ratelimit and make indexing more or less unusable.
  ////////
  validateChainConfigs(allChainIds, requestedPluginNames);

  ////////
  // Invariant: if using a custom START_BLOCK or END_BLOCK, ponder should be configured to index at
  // most one network.
  ////////
  validateGlobalBlockrange(networks, requestedPluginNames);
}
