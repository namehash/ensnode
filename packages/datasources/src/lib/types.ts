import type { Abi, Address, Chain } from "viem";

/**
 * ENSNamespaces encodes the set of well-known ENS namespaces.
 *
 * Each ENS namespace is a single, unified set of ENS names with a distinct onchain root
 * Registry (the ensroot Datasource) and the capability of spanning from that root Registry across
 * other `Datasource`s that may be distributed across multiple chains and offchain resources.
 *
 * For example, as of 9-Feb-2025 the canonical ENS namespace on mainnet includes:
 * - A root Registry on mainnet.
 * - An onchain Registrar for direct subnames of 'eth' on mainnet.
 * - An onchain Registry and Registrar for direct subnames of 'base.eth' on Base.
 * - An onchain Registry and Registrar subregistry for direct subnames of 'linea.eth' on Linea.
 * - An offchain subregistry for subnames of '.cb.id'.
 * - An offchain subregistry for subnames of '.uni.eth'.
 * - Etc..
 *
 * Each ENS namespace is logically independent of & isolated from the others, and not exclusively
 * correlated with a specific L1 chain. For example, the Sepolia and Holesky testnet ENS namepaces
 * are independent of the canonical ENS namespace on mainnet, and there could be an additional
 * deployment of the ENS protocol to mainnet, configured with different Datasources, resulting in a
 * logically isolated set of ENS names.
 *
 * 'ens-test-env' represents an ENS namespace running on a local Anvil chain for testing
 * protocol changes, running deterministic test suites, and local development.
 * https://github.com/ensdomains/ens-test-env
 */
export const ENSNamespaces = {
  Mainnet: "mainnet",
  Sepolia: "sepolia",
  Holesky: "holesky",
  EnsTestEnv: "ens-test-env",
} as const;

/**
 * ENSNamespace is the derived string union of possible ENSNamespace values.
 */
export type ENSNamespace = (typeof ENSNamespaces)[keyof typeof ENSNamespaces];

/**
 * A Datasource describes a set of contracts on a given chain that interact with the ENS protocol.
 */
export interface Datasource {
  chain: Chain;

  // map of contract name to config
  contracts: Record<string, ContractConfig>;
}

/**
 * DatasourceNames encodes a unique id for each known Datasource.
 */
export const DatasourceNames = {
  ENSRoot: "ensroot",
  Basenames: "basenames",
  Lineanames: "lineanames",
  ThreeDNSOptimism: "threedns-optimism",
  ThreeDNSBase: "threedns-base",
} as const;

export type DatasourceName = (typeof DatasourceNames)[keyof typeof DatasourceNames];

/**
 * EventFilter specifies a given event's name and arguments to filter that event by.
 * This type is intentionally a subset of Ponder's `ContractConfig['filter']`.
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
 * Datasources encodes the set of known Datasources within an ENS namespace.
 * The ENSRoot Datasource is required, all others are optional.
 */
export type Datasources = {
  ensroot: Datasource;
} & Partial<Record<Exclude<DatasourceName, "ensroot">, Datasource>>;
