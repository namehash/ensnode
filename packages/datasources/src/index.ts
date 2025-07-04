import {Datasource, DatasourceNames, ENSNamespace, ENSNamespaceId} from "./lib/types";
import type { Chain } from "viem";

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
 * Get a chain object by ID from any datasource
 */
//TODO: Maybe we can make this more efficient?
export const getChainById = (chainId: number): Chain => {
  const ENSNamespaces = Object.values(ENSNamespacesById) as ENSNamespace[];
  const datasources = ENSNamespaces.map((namespace) => Object.values(namespace) as Datasource[]).flat() as Datasource[];
  const datasource = datasources.find((datasource) => datasource.chain.id === chainId);

  if (!datasource) {
    throw new Error(
        `No Datasources are defined for Chain ID "${chainId}".`,
    );
  }

  return datasource.chain;
}

/**
 * Gets the overall block explorer URL for a given chainId
 */
export const getChainBlockExplorerUrl = (chainId: number) : URL | null => {
  const chainBlockExplorer = getChainById(chainId).blockExplorers;

  if (!chainBlockExplorer) {
    return null;
  }

  return new URL(chainBlockExplorer.default.url);
};

/**
 * Gets the block explorer URL for a specific block on a specific chainId
 */
export const getBlockExplorerUrlForBlock = (
    chainId: number,
    blockNumber: number,
): URL | null => {
  const chainBlockExplorer = getChainBlockExplorerUrl(chainId);

  if (!chainBlockExplorer) {
    return null;
  }
  return new URL(`block/${blockNumber}`, chainBlockExplorer.toString());
}