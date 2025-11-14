import ensTestEnv from "./ens-test-env";
import {
  type DatasourceName,
  DatasourceNames,
  type ENSNamespaceId,
  type ExtractDatasourceType,
} from "./lib/types";
import mainnet from "./mainnet";
import sepolia from "./sepolia";

// internal map ENSNamespaceId -> ENSNamespace
const ENSNamespacesById: {
  readonly mainnet: typeof mainnet;
  readonly sepolia: typeof sepolia;
  readonly "ens-test-env": typeof ensTestEnv;
} = {
  mainnet,
  sepolia,
  "ens-test-env": ensTestEnv,
} as const;

/**
 * Returns the ENSNamespace for a specified `namespaceId`.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'ens-test-env')
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
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'ens-test-env')
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
 * Returns the `datasourceName` Datasource within the specified `namespaceId` namespace, or undefined
 * if it does not exist.
 *
 * This is useful when you want to retrieve a Datasource from an arbitrary namespace where it may
 * or may not actually be defined. For example, if using {@link getDatasource}, with a
 * `namespaceId: ENSNamespaceId`, the typechecker will enforce that the only valid `datasourceName`
 * is ENSRoot (the only Datasource present in all namespaces). This method allows you to receive
 * the const Datasource or undefined for a specified `datasourceName`.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'ens-test-env')
 * @param datasourceName - The name of the Datasource to retrieve
 * @returns The Datasource object for the given name within the specified namespace, or undefined if it does not exist
 */
export const maybeGetDatasource = <
  N extends ENSNamespaceId,
  D extends DatasourceName = DatasourceName,
>(
  namespaceId: N,
  datasourceName: D,
): ExtractDatasourceType<ReturnType<typeof getENSNamespace<N>>, D> | undefined =>
  (getENSNamespace(namespaceId) as any)[datasourceName];

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
