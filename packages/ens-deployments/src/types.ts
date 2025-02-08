import type { ContractConfig } from "ponder";
import type { Chain } from "viem";

/**
 * ENSDeploymentChain encodes the supported values of the root chain ENS is deployed to.
 *
 * Each ENSDeploymentChain will map to an ENSDeploymentConfig which dictates the available plugins
 * and their PluginConfig. See the comment in packages/ens-deployments/src/index.ts for context.
 *
 * Note that `ens-test-env` is the specific local Anvil deterministic deployment used in the ens
 * ecosystem for testing purposes. https://github.com/ensdomains/ens-test-env
 */
export type ENSDeploymentChain = "mainnet" | "sepolia" | "holesky" | "ens-test-env";

/**
 * Encodes a unique plugin name.
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

/**
 * An ENS Deployment provides the PluginConfigs for a specific ENS Deployment. See the comment in
 * packages/ens-deployments/src/index.ts for additional context.
 */
export type ENSDeploymentConfig = {
  eth: PluginConfig;
  base?: PluginConfig;
  linea?: PluginConfig;
};
