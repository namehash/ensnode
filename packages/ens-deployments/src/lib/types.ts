import type { Abi, Address, Chain } from "viem";

/**
 * ENSDeploymentChain encodes the set of chains known to provide the root Datasource of an ENSDeployment.
 *
 * Each "ENS deployment" is a single, unified namespace of ENS names with:
 * - A root Registry deployed to the "ENS Deployment" chain.
 * - A capability to expand from that root Registry across any number of additional datasources
 *  (which may be on different chains or offchain).
 *
 * 'ens-test-env' represents an "ENS deployment" running on a local Anvil chain for testing
 * protocol changes, running deterministic test suites, and local development.
 * https://github.com/ensdomains/ens-test-env
 */
export type ENSDeploymentChain = "mainnet" | "sepolia" | "holesky" | "ens-test-env";

/**
 * A Datasource describes a set of contracts on a given chain that interact with the ENS protocol.
 */
export interface Datasource {
  chain: Chain;

  // map of contract name to config
  contracts: Record<string, ContractConfig>;
}

/**
 * DatasourceName encodes a unique id for each known Datasource.
 */
export enum DatasourceName {
  Root = "root",
  Basenames = "basenames",
  Lineanames = "lineanames",
}

/**
 * EventFilter specifies a given event's name and arguments to filter that event by.
 * It is intentionally a subset of Ponder's `ContractConfig['filter']`.
 */
export interface EventFilter {
  event: string;
  args: Record<string, unknown>;
}

/**
 * Defines the abi, address, filter, and startBlock of a contract relevant to a Datasource.
 * A contract is located onchain either by a static `address` or the event signatures (`filter`)
 * one should filter the chain for. This type is intentionally a subset of Ponder's ContractConfig.
 *
 * @param abi - the ABI of the contract
 * @param address - (optional) address of the contract
 * @param filter - (optional) array of event signatures to filter the log by
 * @param startBlock - block number the contract was deployed in
 */
export type ContractConfig =
  | {
      readonly abi: Abi;
      readonly address: Address;
      readonly filter?: never;
      readonly startBlock: number;
    }
  | {
      readonly abi: Abi;
      readonly address?: never;
      readonly filter: EventFilter[];
      readonly startBlock: number;
    };

/**
 * Encodes the set of known Datasources for an "ENS Deployment".
 */
export type ENSDeployment = {
  /**
   * The Datasource for the ENS root.
   *
   * Required for each "ENS deployment".
   */
  [DatasourceName.Root]: Datasource;

  /**
   * The Datasource for Basenames, optional.
   */
  [DatasourceName.Basenames]?: Datasource;

  /**
   * The Datasource for Lineanames, optional.
   */
  [DatasourceName.Lineanames]?: Datasource;
};
