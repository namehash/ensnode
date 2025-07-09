import { DatasourceNames, ENSNamespace, ENSNamespaceId } from "./lib/types";
import {
  optimism,
} from "viem/chains";

import ensTestEnv from "./ens-test-env";
import holesky from "./holesky";
import mainnet from "./mainnet";
import sepolia from "./sepolia";

export * from "./lib/types";

// internal map ENSNamespaceId -> ENSNamespace
const ENSNamespacesById = {
  mainnet,
  sepolia,
  holesky,
  "ens-test-env": ensTestEnv,
} as const satisfies Record<ENSNamespaceId, ENSNamespace>;

/**
 * Returns the ENSNamespace for a specified `namespaceId`.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @returns the ENSNamespace
 */
export const getENSNamespace = <T extends ENSNamespaceId>(
  namespaceId: T,
): (typeof ENSNamespacesById)[T] => ENSNamespacesById[namespaceId];

/**
 * Returns the `datasourceName` Datasource within the specified `namespaceId` namespace.
 *
 * NOTE: the typescript typechecker _will_ enforce validity. i.e. using an invalid `datasourceName`
 * within the specified `namespaceId` will be a type error.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @param datasourceName - The name of the Datasource to retrieve
 * @returns The Datasource object for the given name within the specified namespace
 */
export const getDatasource = <
  N extends ENSNamespaceId,
  D extends keyof ReturnType<typeof getENSNamespace<N>>,
>(
  namespaceId: N,
  datasourceName: D,
) => getENSNamespace(namespaceId)[datasourceName];

/**
 * Returns the chain id for the ENS Root Datasource within the selected namespace.
 *
 * @returns the chain ID that hosts the ENS Root
 */
export const getENSRootChainId = (namespaceId: ENSNamespaceId) =>
  getDatasource(namespaceId, DatasourceNames.ENSRoot).chain.id;


/**
 * Mapping of chain id to chain's default block explorer URL.
 * Chain id standards are organized by the Ethereum Community @ https://github.com/ethereum-lists/chains
 */
const chainBlockExplorers = new Map<number, string>([
  [mainnet[DatasourceNames.ENSRoot].chain.id, "https://etherscan.io"],
  [mainnet[DatasourceNames.Basenames].chain.id, "https://basescan.org"],
  [sepolia[DatasourceNames.ENSRoot].chain.id, "https://sepolia.etherscan.io"],
  [optimism.id, "https://optimistic.etherscan.io"],
  [mainnet[DatasourceNames.Lineanames].chain.id, "https://lineascan.build"],
  [holesky[DatasourceNames.ENSRoot].chain.id, "https://holesky.etherscan.io"],
  [sepolia[DatasourceNames.Basenames].chain.id, "https://sepolia.basescan.org"],
  [sepolia[DatasourceNames.Lineanames].chain.id, "https://sepolia.lineascan.build"],
]);


/**
 * Gets the base block explorer URL for a given chainId
 *
 * @returns default block explorer URL for the chain with the provided id,
 * or null if the referenced chain doesn't have a known block explorer
 */
export const getChainBlockExplorerUrl = (chainId: number): string | null => {
  const chainBlockExplorer = chainBlockExplorers.get(chainId);

  if (!chainBlockExplorer) {
    return null;
  }

  return chainBlockExplorer;
};

/**
 * Gets the block explorer URL for a specific block on a specific chainId
 *
 * @returns complete block explorer URL for a specific block on a specific chainId,
 * or null if the referenced chain doesn't have a known block explorer
 */
export const getBlockExplorerUrlForBlock = (chainId: number, blockNumber: number): URL | null => {
  const chainBlockExplorer = getChainBlockExplorerUrl(chainId);

  if (!chainBlockExplorer) {
    return null;
  }
  return new URL(`block/${blockNumber}`, chainBlockExplorer);
};

/**
 * Mapping of chain id to prettified chain name.
 * Chain id standards are organized by the Ethereum Community @ https://github.com/ethereum-lists/chains
 */
const chainNames = new Map<number, string>([
  [mainnet[DatasourceNames.ENSRoot].chain.id, "Ethereum"],
  [mainnet[DatasourceNames.Basenames].chain.id, "Base"],
  [sepolia[DatasourceNames.ENSRoot].chain.id, "Ethereum Sepolia"],
  [optimism.id, "Optimism"],
  [mainnet[DatasourceNames.Lineanames].chain.id, "Linea"],
  [holesky[DatasourceNames.ENSRoot].chain.id, "Ethereum Holesky"],
  [ensTestEnv[DatasourceNames.ENSRoot].chain.id, "Ethereum Local"],
  [sepolia[DatasourceNames.Basenames].chain.id, "Base Sepolia"],
  [sepolia[DatasourceNames.Lineanames].chain.id, "Linea Sepolia"],
]);

/**
 * Returns a prettified chain name for the provided chain ID,
 * or throws an error if the provided chain id doesn't have an assigned name.
 */
export function getChainName(chainId: number): string {
  const chainName = chainNames.get(chainId);

  if (!chainName) {
    throw new Error(`Chain ID "${chainId}" doesn't have an assigned name`);
  }

  return chainName;
}
