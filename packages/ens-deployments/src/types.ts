import type { ContractConfig } from "ponder";
import type { Chain } from "viem";

/**
 * ENSDeploymentChain encodes the possible values of the root chain ENS is deployed to.
 *
 * Note that `ens-test-env` is the specific local Anvil deterministic deployment used in the ens
 * ecosystem for testing purposes.
 */
export type ENSDeploymentChain = "mainnet" | "sepolia" | "holesky" | "ens-test-env";

/**
 * Encodes a unique plugin name
 */
export type PluginName = "eth" | "base" | "linea";

/**
 * A `ponder#ContractConfig` sans network, as it is provided by the contextual 'deployment', and
 * sans abi, which is specified in the ponder config (necessary for inferred types, it seems).
 */
export type PluginContractConfig = Omit<ContractConfig, "network" | "abi">;

/**
 * Encodes a plugin's source chain and contract configs.
 */
export interface PluginConfig {
  chain: Chain;
  contracts: Record<string, PluginContractConfig>;
}

export type ENSDeploymentConfig = {
  eth: PluginConfig;
  base?: PluginConfig;
  linea?: PluginConfig;
};
