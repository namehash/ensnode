import config from "@/config";

import { DatasourceNames, getDatasource } from "@ensnode/datasources";
import { type AccountId, accountIdEqual, makeRegistryContractId } from "@ensnode/ensnode-sdk";

// TODO: remove, helps types while implementing
if (config.namespace !== "ens-test-env") throw new Error("nope");

const ensroot = getDatasource(config.namespace, DatasourceNames.ENSRoot);

export const ROOT_REGISTRY = {
  chainId: ensroot.chain.id,
  address: ensroot.contracts.RootRegistry.address,
} satisfies AccountId;

export const ROOT_REGISTRY_ID = makeRegistryContractId(ROOT_REGISTRY);

export const isRootRegistry = (accountId: AccountId) => accountIdEqual(accountId, ROOT_REGISTRY);
