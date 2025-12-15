import config from "@/config";

import { DatasourceNames, type ENSNamespaceId } from "@ensnode/datasources";
import {
  type AccountId,
  accountIdEqual,
  getDatasourceContract,
  type InterpretedName,
  type LabelHash,
  maybeGetDatasourceContract,
  type Name,
  uint256ToHex32,
} from "@ensnode/ensnode-sdk";

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

/**
 * Mapping of RegistrarManagedName to its related Registrar and Registrar-adjacent contracts.
 */
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

/**
 * Certain RegistrarManagedNames are different depending on the ENSNamespace — this encodes that
 * relationship.
 */
const RMN_NAMESPACE_OVERRIDE: Partial<Record<ENSNamespaceId, Record<Name, Name>>> = {
  sepolia: {
    "base.eth": "basetest.eth",
    "linea.eth": "linea-sepolia.eth",
  },
};

/**
 * Given a `contract`, identify its RegistrarManagedName.
 */
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

/**
 * Determines whether `contract` is the NameWrapper.
 */
export function isNameWrapper(contract: AccountId) {
  if (accountIdEqual(ethnamesNameWrapper, contract)) return true;
  if (lineanamesNameWrapper && accountIdEqual(lineanamesNameWrapper, contract)) return true;
  return false;
}

/**
 * BaseRegistrar-derived Registrars register direct subnames of a RegistrarManagedName. As such, the
 * tokens issued by them are keyed by the direct subname's label's labelHash.
 *
 * https://github.com/ensdomains/ens-contracts/blob/db613bc/contracts/ethregistrar/ETHRegistrarController.sol#L215
 */
export const registrarTokenIdToLabelHash = (tokenId: bigint): LabelHash => uint256ToHex32(tokenId);
