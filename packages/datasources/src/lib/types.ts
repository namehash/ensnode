import type { Abi, Address, Chain } from "viem";

/**
 * L1Chains encodes the set of chain identifiers that host a well-known ENS namespace.
 */
export const L1Chains = {
  Mainnet: "mainnet",
  Sepolia: "sepolia",
  Holesky: "holesky",
  EnsTestEnv: "ens-test-env",
} as const;

/**
 * L1Chain encodes the possible values of L1Chains.
 */
export type L1Chain = (typeof L1Chains)[keyof typeof L1Chains];

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
  ThreeDNSOptimism = "threedns-optimism",
  ThreeDNSBase = "threedns-base",
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
 * Encodes the set of known Datasources within an ENS namespace.
 */
export type Datasources = {
  /**
   * The Datasource for the ENS root.
   *
   * Required for each ENS namespace.
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

  /**
   * The Datasource for 3DNS-Powered Names on Optimism
   */
  [DatasourceName.ThreeDNSOptimism]?: Datasource;

  /**
   * The Datasource for 3DNS-Powered Names on Base
   */
  [DatasourceName.ThreeDNSBase]?: Datasource;
};
