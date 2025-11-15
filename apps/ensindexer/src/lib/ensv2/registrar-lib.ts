import config from "@/config";

import { DatasourceNames, type ENSNamespaceId } from "@ensnode/datasources";
import {
  type AccountId,
  accountIdEqual,
  type InterpretedName,
  type Name,
} from "@ensnode/ensnode-sdk";

import { getDatasourceContract, maybeGetDatasourceContract } from "@/lib/datasource-helpers";

const ethnamesNameWrapper = getDatasourceContract(
  config.namespace,
  DatasourceNames.ENSRoot,
  "NameWrapper",
);

const lineanamesNameWrapper = maybeGetDatasourceContract(
  config.namespace,
  DatasourceNames.Lineanames,
  "NameWrapper",
);

// TODO: need to handle namespace-specific remap
const REGISTRAR_CONTRACTS_BY_MANAGED_NAME: Record<Name, AccountId[]> = {
  eth: [
    getDatasourceContract(
      config.namespace, //
      DatasourceNames.ENSRoot,
      "BaseRegistrar",
    ),
    getDatasourceContract(
      config.namespace,
      DatasourceNames.ENSRoot,
      "LegacyEthRegistrarController",
    ),
    getDatasourceContract(
      config.namespace,
      DatasourceNames.ENSRoot,
      "WrappedEthRegistrarController",
    ),
    getDatasourceContract(
      config.namespace,
      DatasourceNames.ENSRoot,
      "UnwrappedEthRegistrarController",
    ),
    ethnamesNameWrapper,
  ],
  "base.eth": [
    maybeGetDatasourceContract(
      config.namespace, //
      DatasourceNames.Basenames,
      "BaseRegistrar",
    ),
    maybeGetDatasourceContract(
      config.namespace,
      DatasourceNames.Basenames,
      "EARegistrarController",
    ),
    maybeGetDatasourceContract(
      config.namespace, //
      DatasourceNames.Basenames,
      "RegistrarController",
    ),
    maybeGetDatasourceContract(
      config.namespace,
      DatasourceNames.Basenames,
      "UpgradeableRegistrarController",
    ),
  ].filter((c) => !!c),
  "linea.eth": [
    maybeGetDatasourceContract(config.namespace, DatasourceNames.Lineanames, "BaseRegistrar"),
    maybeGetDatasourceContract(
      config.namespace,
      DatasourceNames.Lineanames,
      "EthRegistrarController",
    ),
    lineanamesNameWrapper,
  ].filter((c) => !!c),
};

const RMN_NAMESPACE_OVERRIDE: Partial<Record<ENSNamespaceId, Record<Name, Name>>> = {
  sepolia: {
    "base.eth": "basetest.eth",
    "linea.eth": "linea-sepolia.eth",
  },
};

export const getRegistrarManagedName = (contract: AccountId) => {
  for (const [managedName, contracts] of Object.entries(REGISTRAR_CONTRACTS_BY_MANAGED_NAME)) {
    const isAnyOfTheContracts = contracts.some((_contract) => accountIdEqual(_contract, contract));
    if (isAnyOfTheContracts) {
      const namespaceSpecificManagedName =
        RMN_NAMESPACE_OVERRIDE[config.namespace]?.[managedName] ?? managedName;
      // override the rmn with namespace-specific version if available
      return namespaceSpecificManagedName as InterpretedName;
    }
  }

  throw new Error("never");
};

export function isNameWrapper(contract: AccountId) {
  if (accountIdEqual(ethnamesNameWrapper, contract)) return true;
  if (lineanamesNameWrapper && accountIdEqual(lineanamesNameWrapper, contract)) return true;
  return false;
}
