import type { Abi, Address, Chain } from "viem";

/**
 * Re-export @ensnode/ensnode-sdk members for backward compatibility.
 * Note: previously, these were part of the @ensnode/datasources package.
 */
export { ENSNamespaceIds, type ENSNamespaceId } from "@ensnode/ensnode-sdk";

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
