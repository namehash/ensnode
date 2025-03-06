import type { factory } from "ponder";
import type { Abi, Address, Chain } from "viem";

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
export type SubregistryName = "eth" | "base" | "linea" | "ens-v2";

/**
 * EventFilter specifies a given event's name and arguments to filter that event by.
 * It is intentionally a subset of ponder's `ContractConfig['filter']`.
 */
export interface EventFilter {
  event: string;
  args: Record<string, unknown>;
}

/**
 * Defines the abi, address, filter, and startBlock of a contract relevant to indexing a subregistry.
 * A contract is located on-chain either by a static `address` or the event signatures (`filter`)
 * one should filter the chain for.
 *
 * @param abi - the ABI of the contract
 * @param address - (optional) address of the contract
 * @param filter - (optional) array of event signatures to filter the log by
 * @param startBlock - block number the contract was deployed in
 */
export type SubregistryContractConfig =
  | {
      readonly abi: Abi;
      readonly address: Address;
      readonly filter?: never;
      readonly factory?: never;
      readonly startBlock: number;
    }
  | {
      readonly abi: Abi;
      readonly address?: never;
      readonly filter: EventFilter[];
      readonly factory?: never;
      readonly startBlock: number;
    }
  | {
      readonly abi: Abi;
      readonly address?: never;
      readonly filter?: never;
      readonly factory: Parameters<typeof factory>[0];
      readonly startBlock: number;
    };

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

  /**
   * ENS v2 Contracts
   * TODO: the naming in this package is no longer accurate — perhaps this should be 'AddressBook'
   * or something like that.
   */
  "ens-v2"?: SubregistryDeploymentConfig;
};
