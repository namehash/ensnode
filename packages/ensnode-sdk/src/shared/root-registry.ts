import { DatasourceNames, type ENSNamespaceId, getDatasource } from "@ensnode/datasources";
import { type AccountId, accountIdEqual, makeRegistryId } from "@ensnode/ensnode-sdk";

/**
 * Gets the AccountId representing the ENSv2 Root Registry in the selected `namespace`.
 */
export const getRootRegistry = (namespace: ENSNamespaceId) => {
  const ensroot = getDatasource(namespace, DatasourceNames.ENSRoot);

  return {
    chainId: ensroot.chain.id,
    address: ensroot.contracts.RootRegistry.address,
  } satisfies AccountId;
};

/**
 * Gets the RegistryId representing the ENSv2 Root Registry in the selected `namespace`.
 */
export const getRootRegistryId = (namespace: ENSNamespaceId) =>
  makeRegistryId(getRootRegistry(namespace));

/**
 * Determines whether `contract` is the ENSv2 Root Registry in `namespace`.
 */
export const isRootRegistry = (namespace: ENSNamespaceId, contract: AccountId) =>
  accountIdEqual(getRootRegistry(namespace), contract);
