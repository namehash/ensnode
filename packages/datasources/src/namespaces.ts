import ensTestEnv from "./ens-test-env";
import holesky from "./holesky";
import {
  ChainAddress,
  ChainId,
  Datasource,
  DatasourceName,
  DatasourceNames,
  ENSNamespace,
  ENSNamespaceId,
} from "./lib/types";
import mainnet from "./mainnet";
import sepolia from "./sepolia";

// internal map ENSNamespaceId -> ENSNamespace
const ENSNamespacesById: {
  readonly mainnet: typeof mainnet;
  readonly sepolia: typeof sepolia;
  readonly holesky: typeof holesky;
  readonly "ens-test-env": typeof ensTestEnv;
} = {
  mainnet,
  sepolia,
  holesky,
  "ens-test-env": ensTestEnv,
} as const;

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
): ReturnType<typeof getENSNamespace<N>>[D] => getENSNamespace(namespaceId)[datasourceName];

/**
 * Returns the `datasourceName` Datasource within the specified `namespaceId` namespace, or undefined
 * if it does not exist.
 *
 * This is useful when you want to retrieve a Datasource from an arbitrary namespace where it may
 * or may not actually be defined. For example, if using {@link getDatasource}, with a
 * `namespaceId: ENSNamespaceId`, the typechecker will enforce that the only valid `datasourceName`
 * is ENSRoot (the only Datasource present in all namespaces). This method allows you to receive
 * `Datasource | undefined` for a specified `datasourceName`.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @param datasourceName - The name of the Datasource to retrieve
 * @returns The Datasource object for the given name within the specified namespace, or undefined if it does not exist
 */
export const maybeGetDatasource = (
  namespaceId: ENSNamespaceId,
  datasourceName: DatasourceName,
): Datasource | undefined => (getENSNamespace(namespaceId) as ENSNamespace)[datasourceName];

/**
 * Returns the chain address for the specified namespace, datasource, and
 * contract name, or undefined if it does not exist or is not a single chain address.
 *
 * This is useful when you want to retrieve the ChainAddress for an arbitrary contract
 * where it may or may not actually be defined.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g.
 *                      'mainnet', 'sepolia', 'holesky', 'ens-test-env')
 * @param datasourceName - The name of the Datasource to search for contractName in
 * @param contractName - The name of the contract to retrieve the chain address for
 * @returns The ChainAddress for the given namespace, datasource, and contract
 *          name, or undefined if it does not exist or is not a single chain address
 */
export const maybeGetDatasourceContractChainAddress = (
  namespaceId: ENSNamespaceId,
  datasourceName: DatasourceName,
  contractName: string,
): ChainAddress | undefined => {
  const datasource = maybeGetDatasource(namespaceId, datasourceName);
  if (!datasource) return undefined;
  const maybeAddress = datasource.contracts[contractName]?.address;
  if (maybeAddress === undefined || Array.isArray(maybeAddress)) return undefined;
  return {
    chainId: datasource.chain.id,
    address: maybeAddress,
  } satisfies ChainAddress;
};

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
 * Gets all the chainIds with datasources in the specified namespace.
 *
 * @param namespaceId - The ENSNamespace identifier (e.g. 'mainnet', 'sepolia', 'holesky',
 * 'ens-test-env')
 * @returns an array of distinct chainIds with datasources in the specified namespace
 */
export const getChainIdsForNamespace = (namespaceId: ENSNamespaceId): ChainId[] => {
  const namespace = getENSNamespace(namespaceId);
  const chainIds = Object.values(namespace).map((datasource) => datasource.chain.id);
  return [...new Set(chainIds)];
};
