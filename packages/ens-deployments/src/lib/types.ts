import type { Abi, Address, Chain } from "viem";

/**
 * Encodes a set of chains known to provide an "ENS deployment".
 *
 * Each "ENS deployment" is a single, unified namespace of ENS names with:
 * - A root Registry deployed to the "ENS Deployment" chain.
 * - A capability to expand from that root Registry across any number of additional datasources.
 *
 * 'ens-test-env' represents an "ENS deployment" running on a local Anvil chain for testing
 * protocol changes, running deterministic test suites, and local development.
 * https://github.com/ensdomains/ens-test-env
 */
export type ENSDeploymentChain = "mainnet" | "sepolia" | "holesky" | "ens-test-env";

/**
 * EventFilter specifies a given event's name and arguments to filter that event by.
 * It is intentionally a subset of ponder's `ContractConfig['filter']`.
 */
export interface EventFilter {
  event: string;
  args: Record<string, unknown>;
}

/**
 * Defines the abi, address, filter, and startBlock of a contract relevant to a Datasource.
 * A contract is located on-chain either by a static `address` or the event signatures (`filter`)
 * one should filter the chain for.
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
 * A DeploymentDatasource describes a set of contracts on a given chain that extend the ENS root.
 *
 * NOTE: this currently encodes the assumption that a given on-chain ENS datasource correlates to
 * contracts on exactly 1 chain. If this is not the case in the future, DeploymentDatasource can
 * be updated to reflect that OR multiple `DeploymentDatasources` can be defined, and the respective
 * ENSIndexer Plugin can intentionally read from multiple DeploymentDatasources to construct its
 * Ponder config.
 */
export interface DeploymentDatasource {
  chain: Chain;
  contracts: Record<string, ContractConfig>;
}

/**
 * Encodes the set of known 'sources' for an "ENS Deployment".
 */
export type ENSDeployment = {
  /**
   * The ENS Root and its associated contracts.
   *
   * Required for each "ENS deployment".
   */
  root: DeploymentDatasource;

  /**
   * Basenames and its associated contracts, optional.
   */
  basenames?: DeploymentDatasource;

  /**
   * Linea Names and its associated contracts, optional.
   */
  lineanames?: DeploymentDatasource;
};
