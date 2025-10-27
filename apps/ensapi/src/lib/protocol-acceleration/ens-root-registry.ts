import config from "@/config";
import { DatasourceNames, getDatasource } from "@ensnode/datasources";
import { AccountId, accountIdEqual } from "@ensnode/ensnode-sdk";

const ensRoot = getDatasource(config.namespace, DatasourceNames.ENSRoot);

/**
 * The AccountId of the ENS Registry on the Root Chain.
 */
export const ENS_ROOT_REGISTRY: AccountId = {
  chainId: ensRoot.chain.id,
  address: ensRoot.contracts.Registry.address,
};

export function isENSRootRegistry(accountId: AccountId) {
  return accountIdEqual(accountId, ENS_ROOT_REGISTRY);
}
