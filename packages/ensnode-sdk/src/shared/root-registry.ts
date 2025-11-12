import { DatasourceNames, type ENSNamespaceId, getDatasource } from "@ensnode/datasources";
import { type AccountId, accountIdEqual, makeRegistryContractId } from "@ensnode/ensnode-sdk";

/**
 * TODO
 */
export const getRootRegistry = (namespace: ENSNamespaceId) => {
  const ensroot = getDatasource(namespace, DatasourceNames.ENSRoot);

  // TODO: remove when all defined
  if (!("RootRegistry" in ensroot.contracts))
    throw new Error(`Namespace ${namespace} does not define ENSv2 Root Registry.`);

  return {
    chainId: ensroot.chain.id,
    address: ensroot.contracts.RootRegistry.address,
  } satisfies AccountId;
};

/**
 * TODO
 */
export const getRootRegistryId = (namespace: ENSNamespaceId) =>
  makeRegistryContractId(getRootRegistry(namespace));

/**
 * TODO
 */
export const isRootRegistry = (namespace: ENSNamespaceId, accountId: AccountId) =>
  accountIdEqual(getRootRegistry(namespace), accountId);
