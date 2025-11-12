import {
  DatasourceNames,
  type ENSNamespaceId,
  getDatasource,
  maybeGetDatasource,
} from "@ensnode/datasources";
import { type AccountId, accountIdEqual } from "@ensnode/ensnode-sdk";

/**
 *
 */
export function isNameWrapper(namespace: ENSNamespaceId, contract: AccountId) {
  const ensroot = getDatasource(namespace, DatasourceNames.ENSRoot);
  const lineanames = maybeGetDatasource(namespace, DatasourceNames.Lineanames);

  const isRootNameWrapper = accountIdEqual(contract, {
    chainId: ensroot.chain.id,
    address: ensroot.contracts.NameWrapper.address,
  });

  const isLineanamesNameWrapper =
    lineanames !== undefined &&
    accountIdEqual(contract, {
      chainId: lineanames.chain.id,
      address: lineanames.contracts.NameWrapper.address,
    });

  return isRootNameWrapper || isLineanamesNameWrapper;
}
