import { DatasourceNames, type ENSNamespaceId, getDatasource } from "@ensnode/datasources";
import { type AccountId, accountIdEqual, makeRegistryId } from "@ensnode/ensnode-sdk";

/**
 * TODO
 */
export const getRootRegistry = (namespace: ENSNamespaceId) => {
  const ensroot = getDatasource(namespace, DatasourceNames.ENSRoot);

  return {
    chainId: ensroot.chain.id,
    address: ensroot.contracts.RootRegistry.address,
  } satisfies AccountId;
};

/**
 * TODO
 */
export const getRootRegistryId = (namespace: ENSNamespaceId) =>
  makeRegistryId(getRootRegistry(namespace));

/**
 * TODO
 */
export const isRootRegistry = (namespace: ENSNamespaceId, accountId: AccountId) =>
  accountIdEqual(getRootRegistry(namespace), accountId);
