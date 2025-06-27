import { DatasourceNames, ENSNamespace, ENSNamespaceId } from "./lib/types";

import ensTestEnv from "./ens-test-env";
import holesky from "./holesky";
import mainnet from "./mainnet";
import sepolia from "./sepolia";
import {getAddress, Address} from "viem";

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
 * Returns an Address object of the NameWrapper contract from the root datasource of a specific namespace.
 *
 * @returns the viem#Address object
 */
export const getNameWrapperAddress = (namespaceId: ENSNamespaceId): Address =>
    getAddress(getDatasource(namespaceId, DatasourceNames.ENSRoot).contracts.NameWrapper.address);

/**
 * Get ENS app URL for wallet address on a supported chain.
 * NOTE: not every ENS deployment has an ENS app URL.
 * @param {ENSNamespaceId} namespaceId - ENS Namespace identifier
 * @returns ENS app URL for supported networks, otherwise undefined
 */
//TODO: With current use-cases existance of getEnsNameDetailsUrl function probably defeats the point of using this one
export function getEnsAppUrl(namespaceId: ENSNamespaceId): URL | null{
  switch (namespaceId) {
    case "mainnet":
      return new URL(`https://app.ens.domains/`);
    case "sepolia":
      return new URL(`https://sepolia.app.ens.domains/`);
    case "holesky":
      return new URL(`https://holesky.app.ens.domains/`);
    case "ens-test-env":
      // ens-test-env cannot be served by app.ens.domains website
      return null;
  }
}

/**
 * Get the avatar image URL for a given ENS Namespace and name
 *
 * NOTE: not every ENS deployment has an ENS metadata URL or the avatar lookup API.
 *
 * @param {ENSNamespaceId} namespaceId - ENS Namespace identifier
 * @param {string} name - ENS name that we perform the lookup for
 * @returns avatar image URL for supported networks, otherwise null
 */

//TODO: could we change `name` to `primaryName` or is that an oversimplification?
//TODO: function name could also be improved on
export function getEnsNameAvatarUrl(namespaceId: ENSNamespaceId, name: string): URL | null {
  switch (namespaceId) {
    case "mainnet":
      return new URL(name, `https://metadata.ens.domains/mainnet/avatar/`);
    case "sepolia":
      return new URL(name, `https://metadata.ens.domains/sepolia/avatar/`);
    case "holesky":
      // NOTE: metadata.ens.domains doesn't currently support holesky
      return null;
    case "ens-test-env":
      // ens-test-env runs on a local chain and is not supported by metadata.ens.domains
      return null;
  }
}

/**
 * Get the URL of the name details page in ENS app for a given name and ENS Namespace.
 *
 * NOTE: not every ENS deployment has an ENS app URL.
 */
export function getEnsNameDetailsUrl(namespaceId: ENSNamespaceId, name: string): URL | null {
  switch (namespaceId) {
    case "mainnet":
      return new URL(name, `https://app.ens.domains/`);
    case "sepolia":
      return new URL(name, `https://sepolia.app.ens.domains/`);
    case "holesky":
      return new URL(name, `https://holesky.app.ens.domains/`);
    case "ens-test-env":
      // ens-test-env cannot be served by app.ens.domains website
      return null;
  }
}



