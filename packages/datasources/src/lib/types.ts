import type { Abi, Address, Chain } from "viem";

/**
 * ENSNamespaceIds encodes the set of identifiers for well-known ENS namespaces.
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
export const ENSNamespaceIds = {
  Mainnet: "mainnet",
  Sepolia: "sepolia",
  Holesky: "holesky",
  EnsTestEnv: "ens-test-env",
} as const;

/**
 * ENSNamespaceId is the derived string union of possible ENS namespace identifiers.
 */
export type ENSNamespaceId = (typeof ENSNamespaceIds)[keyof typeof ENSNamespaceIds];

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
  ReverseResolverRoot: "reverse-resolver-root",
  ReverseResolverBase: "reverse-resolver-base",
  ReverseResolverLinea: "reverse-resolver-linea",
  ReverseResolverOptimism: "reverse-resolver-optimism",
  ReverseResolverArbitrum: "reverse-resolver-arbitrum",
  ReverseResolverScroll: "reverse-resolver-scroll",
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
 *
 * A contract is located onchain either by
 *  1. a single Address in `address`,
 *  2. a set of Address[] in `address`,
 *  3. or a set of event signatures in `filter`.
 *
 * This type is intentionally a subset of Ponder's ContractConfig.
 *
 * @param abi - the ABI of the contract
 * @param address - (optional) Address of the contract or Address[] of each contract to be indexed
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
      readonly address: Address[];
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
 * ENSNamespace encodes a set of known Datasources associated with the same ENS namespace.
 *
 * The ENSRoot Datasource is required (this formally defines an ENS namespace). All other Datasources
 * within the ENSNamespace are optional.
 */
export type ENSNamespace = {
  [DatasourceNames.ENSRoot]: Datasource;
} & Partial<Record<Exclude<DatasourceName, "ensroot">, Datasource>>;
