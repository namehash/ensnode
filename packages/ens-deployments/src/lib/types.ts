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
  ThreeDNSOptimism = "threedns-optimism",
  ThreeDNSBase = "threedns-base",
  ReverseResolverRoot = "reverse-resolver-root",
  ReverseResolverBase = "reverse-resolver-base",
  ReverseResolverLinea = "reverse-resolver-linea",
  ReverseResolverOptimism = "reverse-resolver-optimism",
  ReverseResolverArbitrum = "reverse-resolver-arbitrum",
  ReverseResolverScroll = "reverse-resolver-scroll",
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
      readonly address: Address | Address[];
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

  /**
   * The Datasource for 3DNS-Powered Names on Optimism, optional
   */
  [DatasourceName.ThreeDNSOptimism]?: Datasource;

  /**
   * The Datasource for 3DNS-Powered Names on Base, optional.
   */
  [DatasourceName.ThreeDNSBase]?: Datasource;

  /**
   * The Datasource for Reverse Resolver on the ENS Root, optional.
   */
  [DatasourceName.ReverseResolverRoot]?: Datasource;

  /**
   * The Datasource for Reverse Resolver on Base, optional.
   */
  [DatasourceName.ReverseResolverBase]?: Datasource;

  /**
   * The Datasource for Reverse Resolver on Optimism, optional.
   */
  [DatasourceName.ReverseResolverOptimism]?: Datasource;

  /**
   * The Datasource for Reverse Resolver on Arbitrum, optional.
   */
  [DatasourceName.ReverseResolverArbitrum]?: Datasource;

  /**
   * The Datasource for Reverse Resolver on Scroll, optional.
   */
  [DatasourceName.ReverseResolverScroll]?: Datasource;

  /**
   * The Datasource for Reverse Resolver on Linea, optional.
   */
  [DatasourceName.ReverseResolverLinea]?: Datasource;
};
