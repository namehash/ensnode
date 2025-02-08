import type { ContractConfig } from "ponder";
import type { Chain } from "viem";

/**
 * Encodes a set of chains known to provide an "ENS deployment".
 *
 * Each "ENS deployment" is a single, unified namespace of ENS names with:
 * - A root Registry deployed to the "ENS Deployment" chain.
 * - A capability to expand from that root Registry across any number of chains, subregistries, and offchain resources.
 *
 * 'ens-test-env' represents an "ENS deployment" running on a local Anvil chain for testing
 * protocol changes, running deterministic test suites, and local development.
 * https://github.com/ensdomains/ens-test-env
 */
export type ENSDeploymentChain = "mainnet" | "sepolia" | "holesky" | "ens-test-env";

/**
 * Encodes a set of known subregistries.
 */
export type SubregistryName = "eth" | "base" | "linea";

/**
 * A `ponder#ContractConfig` sans network, as it is provided by the contextual 'deployment', and
 * sans abi, which is specified in the ponder config (necessary for inferred types, it seems).
 */
export type SubregistryContractConfig = Omit<ContractConfig, "network" | "abi">;

/**
 * Encodes the deployment of a subregistry, including the target chain and contracts.
 */
export interface SubregistryDeploymentConfig {
  chain: Chain;
  contracts: Record<string, SubregistryContractConfig>;
}

/**
 * Encodes the set of known subregistries for an "ENS deployment".
 */
export type ENSDeploymentConfig = {
  /**
   * Subregistry for direct subnames of 'eth'.
   *
   * Required for each "ENS deployment".
   */
  eth: SubregistryDeploymentConfig;

  /**
   * Subregistry for direct subnames of 'base.eth'.
   *
   * Optional for each "ENS deployment".
   */
  base?: SubregistryDeploymentConfig;

  /**
   * Subregistry for direct subnames of 'linea.eth'.
   *
   * Optional for each "ENS deployment".
   */
  linea?: SubregistryDeploymentConfig;
};
