import type { Address, Chain } from "viem";

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
 * Defines the address and startBlock of a contract relevant to indexing a subregistry. Note that
 * address is undefined, because some contracts (i.e. Resolver) are defined by their event signatures
 * and not a specific address.
 */
export interface SubregistryContractConfig {
  readonly address?: Address;
  readonly filter?: { event: string; args: Record<string, unknown> }[];
  readonly startBlock?: number;
}

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
