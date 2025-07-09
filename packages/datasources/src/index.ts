import { DatasourceNames, ENSNamespace, ENSNamespaceId, ENSNamespaceIds } from "./lib/types";

import { Address } from "viem";
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
