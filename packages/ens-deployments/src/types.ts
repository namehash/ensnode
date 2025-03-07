import type { ContractConfig as PonderContractConfig } from "ponder";
import type { Chain } from "viem";

/**
 * Encodes a set of chains known to provide an "ENS deployment".
 *
 * Each "ENS deployment" is a single, unified, and isolated namespace of ENS names.
 *
 * A deployment include ENSv1 contracts with:
 * - A root Registry deployed to the L1 indicated by the `ENSDeploymentChain`.
 * - A capability to expand from that root Registry across any number of chains, subregistries, and
 *   offchain resources.
 *
 * A deployment may include ENSv2 contracts.
 *
 * NOTE: the 'ens-test-env' deployment represents an ENS deployment running on a local Anvil chain
 * for testing protocol changes, running deterministic test suites, and local development.
 * https://github.com/ensdomains/ens-test-env
 */
export type ENSDeploymentChain = "mainnet" | "sepolia" | "holesky" | "ens-test-env";

/**
 * Defines the abi, address, filter, and startBlock of a contract relevant to indexing a subregistry.
 * See Ponder's [Contracts and Networks Documentation](https://ponder.sh/docs/contracts-and-networks)
 * for more information.
 *
 * @param abi - the ABI of the contract
 * @param address - (optional) address of the contract or a factory spec
 * @param filter - (optional) array of event signatures to filter the log by
 * @param startBlock - (required) block to start indexing from
 */
export type ContractConfig = Pick<PonderContractConfig, "abi" | "address" | "filter"> & {
  startBlock: number;
};

/**
 * Encodes a set of contract configs on a given chain.
 */
export interface AddressBook {
  chain: Chain;
  contracts: Record<string, ContractConfig>;
}

/**
 * Encodes the set of known contract configs for a given "ENS deployment" root
 */
export type ENSDeploymentConfig = {
  /**
   * Subregistry for direct subnames of 'eth'.
   *
   * Required for each "ENS deployment".
   */
  eth: AddressBook;

  /**
   * Subregistry for direct subnames of 'base.eth'.
   *
   * Optional for each "ENS deployment".
   */
  base?: AddressBook;

  /**
   * Subregistry for direct subnames of 'linea.eth'.
   *
   * Optional for each "ENS deployment".
   */
  linea?: AddressBook;

  /**
   * ENS v2 Contracts
   *
   * Optional for each "ENS deployment".
   */
  "ens-v2"?: AddressBook;
};
