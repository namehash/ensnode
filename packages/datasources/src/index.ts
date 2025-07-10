import { Address } from "viem";
import {
  base,
  baseSepolia,
  holesky as holeskyChain,
  linea,
  lineaSepolia,
  mainnet as mainnetChain,
  optimism,
  sepolia as sepoliaChain,
} from "viem/chains";
import ensTestEnv from "./ens-test-env";
import holesky from "./holesky";
import { DatasourceNames, ENSNamespace, ENSNamespaceId, ENSNamespaceIds } from "./lib/types";
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
export const getENSNamespace = <N extends ENSNamespaceId>(
  namespaceId: N,
): (typeof ENSNamespacesById)[N] => ENSNamespacesById[namespaceId];

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
 * Returns the chain for the ENS Root Datasource within the selected namespace.
 *
 * @returns the chain that hosts the ENS Root
 */
export const getENSRootChain = (namespaceId: ENSNamespaceId) =>
  getDatasource(namespaceId, DatasourceNames.ENSRoot).chain;

/**
 * Returns the chain id for the ENS Root Datasource within the selected namespace.
 *
 * @returns the chain ID that hosts the ENS Root
 */
export const getENSRootChainId = (namespaceId: ENSNamespaceId) => getENSRootChain(namespaceId).id;

/**
 * Returns the Address of the NameWrapper contract within the requested namespace.
 *
 * @returns the viem#Address object
 */
export const getNameWrapperAddress = (namespaceId: ENSNamespaceId): Address =>
  getDatasource(namespaceId, DatasourceNames.ENSRoot).contracts.NameWrapper.address;

/**
 * Get the ENS Manager App URL for the provided namespace.
 *
 * @param {ENSNamespaceId} namespaceId - ENS Namespace identifier
 * @returns ENS Manager App URL for the provided namespace, or null if the provided namespace doesn't have a known ENS Manager App
 */
export function getEnsManagerAppUrl(namespaceId: ENSNamespaceId): URL | null {
  switch (namespaceId) {
    case ENSNamespaceIds.Mainnet:
      return new URL(`https://app.ens.domains/`);
    case ENSNamespaceIds.Sepolia:
      return new URL(`https://sepolia.app.ens.domains/`);
    case ENSNamespaceIds.Holesky:
      return new URL(`https://holesky.app.ens.domains/`);
    case ENSNamespaceIds.EnsTestEnv:
      // ens-test-env runs on a local chain and is not supported by app.ens.domains
      return null;
  }
}

/**
 * Get the avatar image URL for a name on the given ENS Namespace
 *
 * @param {ENSNamespaceId} namespaceId - ENS Namespace identifier
 * @param {string} name - ENS name to get the avatar image URL for
 * @returns avatar image URL for the name on the given ENS Namespace, or null if the avatar image URL is not known
 */
export function getNameAvatarUrl(name: string, namespaceId: ENSNamespaceId): URL | null {
  switch (namespaceId) {
    case ENSNamespaceIds.Mainnet:
      return new URL(name, `https://metadata.ens.domains/mainnet/avatar/`);
    case ENSNamespaceIds.Sepolia:
      return new URL(name, `https://metadata.ens.domains/sepolia/avatar/`);
    case ENSNamespaceIds.Holesky:
      // metadata.ens.domains doesn't currently support holesky
      return null;
    case ENSNamespaceIds.EnsTestEnv:
      // ens-test-env runs on a local chain and is not supported by metadata.ens.domains
      return null;
  }
}

/**
 * Get the URL of the name details page in ENS Manager App for a given name and ENS Namespace.
 *
 * @returns URL to the name details page in the ENS Manager App for a given name and ENS Namespace, or null if this URL is not known
 */
export function getNameDetailsUrl(name: string, namespaceId: ENSNamespaceId): URL | null {
  const baseUrl = getEnsManagerAppUrl(namespaceId);

  return baseUrl ? new URL(name, baseUrl) : null;
}

/**
 * Get the URL of the address details page in ENS Manager App for a given address and ENS Namespace.
 *
 * @returns URL to the address details page in the ENS Manager App for a given address and ENS Namespace, or null if this URL is not known
 */
export function getAddressDetailsUrl(address: Address, namespaceId: ENSNamespaceId): URL | null {
  const baseUrl = getEnsManagerAppUrl(namespaceId);

  return baseUrl ? new URL(address, baseUrl) : null;
}

/**
 * Mapping of chain id to chain's default block explorer URL.
 * Chain id standards are organized by the Ethereum Community @ https://github.com/ethereum-lists/chains
 */
const chainBlockExplorers = new Map<number, string>([
  [mainnetChain.id, "https://etherscan.io"],
  [base.id, "https://basescan.org"],
  [sepoliaChain.id, "https://sepolia.etherscan.io"],
  [optimism.id, "https://optimistic.etherscan.io"],
  [linea.id, "https://lineascan.build"],
  [holeskyChain.id, "https://holesky.etherscan.io"],
  [baseSepolia.id, "https://sepolia.basescan.org"],
  [lineaSepolia.id, "https://sepolia.lineascan.build"],
]);

/**
 * Gets the base block explorer URL for a given chainId
 *
 * @returns default block explorer URL for the chain with the provided id,
 * or null if the referenced chain doesn't have a known block explorer
 */
export const getChainBlockExplorerUrl = (chainId: number): URL | null => {
  const chainBlockExplorer = chainBlockExplorers.get(chainId);

  if (!chainBlockExplorer) {
    return null;
  }

  return new URL(chainBlockExplorer);
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
  return new URL(`block/${blockNumber}`, chainBlockExplorer.toString());
};

/**
 * Mapping of chain id to prettified chain name.
 * Chain id standards are organized by the Ethereum Community @ https://github.com/ethereum-lists/chains
 */
const chainNames = new Map<number, string>([
  [mainnetChain.id, "Ethereum"],
  [base.id, "Base"],
  [sepoliaChain.id, "Ethereum Sepolia"],
  [optimism.id, "Optimism"],
  [linea.id, "Linea"],
  [holeskyChain.id, "Ethereum Holesky"],
  [1337, "Ethereum Local"], // ens-test-env runs on a local Anvil chain with id 1337
  [baseSepolia.id, "Base Sepolia"],
  [lineaSepolia.id, "Linea Sepolia"],
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
