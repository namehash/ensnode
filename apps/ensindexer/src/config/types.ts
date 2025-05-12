import { Blockrange } from "@/lib/types";
import { ENSDeploymentChain } from "@ensnode/ens-deployments";
import { Chain } from "viem";

/**
 * Configuration for a single blockchain network (chain) used by ENSIndexer.
 */
export interface ChainConfig {
  /**
   * The RPC endpoint URL for the chain.
   * Example: "https://eth-mainnet.g.alchemy.com/v2/..."
   */
  rpcEndpointUrl: string;

  /**
   * The maximum number of RPC requests per second allowed for this chain.
   * Used to avoid rate limiting by the RPC provider.
   */
  rpcMaxRequestsPerSecond: number;
}

/**
 * The complete runtime configuration for an ENSIndexer application instance.
 */
export interface ENSIndexerConfig {
  /**
   * The ENS deployment chain identifier (e.g. "mainnet", "sepolia").
   */
  ensDeploymentChain: ENSDeploymentChain;

  /**
   * The global block range to index (start and end block numbers).
   */
  globalBlockrange: Blockrange;

  /**
   * Public URL for the ENS node.
   */
  ensNodePublicUrl: string;

  /**
   * Admin URL for the ENS node.
   */
  ensAdminUrl: string;

  /**
   * The database schema used by Ponder for indexing.
   */
  ponderDatabaseSchema: string;

  /**
   * List of plugin names requested/activated for this indexer run.
   */
  requestedPluginNames: string[];

  /**
   * Whether to heal reverse address records during indexing.
   */
  healReverseAddresses: boolean;

  /**
   * The port on which the Ponder server should run.
   */
  ponderPort: number;

  /**
   * The ENS Rainbow endpoint URL.
   */
  ensRainbowEndpointUrl: string;

  /**
   * Configuration for each supported chain, keyed by chain ID.
   */
  chains: Record<Chain["id"], ChainConfig>;
}
