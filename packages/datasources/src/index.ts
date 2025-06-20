import type { Datasources, L1Chain } from "./lib/types";

import ensTestEnv from "./ens-test-env";
import holesky from "./holesky";
import mainnet from "./mainnet";
import sepolia from "./sepolia";

export * from "./lib/types";

/**
 * ENSNamespaces maps from an L1Chain to a set of Datasources.
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
 * Each ENS namespace is logically independent of & isolated from the others.
 * For example, the Sepolia and Holesky testnet ENS namepaces are independent of the canonical
 * ENS namespace on mainnet.
 *
 * 'ens-test-env' represents an ENS namespace running on a local Anvil chain for testing
 * protocol changes, running deterministic test suites, and local development.
 * https://github.com/ensdomains/ens-test-env
 */
const ENSNamespaces = {
  mainnet,
  sepolia,
  holesky,
  "ens-test-env": ensTestEnv,
} as const satisfies Record<L1Chain, Datasources>;

/**
 * CommonDatasourcesType is a helper type necessary to support runtime-conditional Ponder plugins.
 *
 * 1. ENSNode can be configured to index from any defined ENS namespace
 *   (currently: mainnet, sepolia, holesky, ens-test-env), using a user-specified set of plugins.
 * 2. Ponder's inferred type-checking requires const-typed values, and so those plugins must be able
 *   to define their Ponder config statically, without awareness of whether they are actively executed
 *   or not.
 * 3. To make this work, we provide a CommonDatasourcesType, set to the typeof mainnet's Datasources,
 *   which fully defines all known (if this is ever not the case, a merged type can be used to ensure
 *   that the CommonType has the full set of possible Datasources). Plugins can use the runtime value
 *   returned from {@link getCommonDatasources} and by casting it to CommonType we ensure that the
 *   values expected by those plugins pass the typechecker. ENSNode ensures that non-active plugins
 *   are not executed, however, so the issue of type/value mismatch does not occur during execution.
 */
export type CommonDatasourcesType = typeof ENSNamespaces.mainnet;

/**
 * Returns the Datasources on the specified L1 chain, cast to the CommonType.
 *
 * This function takes an L1 chain identifier and returns the corresponding Datasources.
 * The returned datasources configuration is cast to the global CommonType to ensure that ponder's
 * inferred typing works at type-check time. See {@link CommonDatasourcesType} for more info.
 *
 * @param l1Chain - The L1 chain identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @returns The Datasources for the specified L1 chain
 */
export const getCommonDatasources = (l1Chain: L1Chain) =>
  getDatasources(l1Chain) as CommonDatasourcesType;

/**
 * Returns the Datasources on the specified L1 chain (as const).
 *
 * @param l1Chain - The L1 chain identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @returns The Datasources for the specified L1 chain
 */
export const getDatasources = <T extends L1Chain>(l1Chain: T): (typeof ENSNamespaces)[T] =>
  ENSNamespaces[l1Chain];
