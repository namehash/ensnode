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

import { toJson } from "@/lib/json-stringify-with-bigints";

/**
 * Many contracts within the ENSv1 Ecosystem are relative to a parent Name. For example,
 * the .eth BaseRegistrar (and RegistrarConrollers) manage direct subnames of .eth. As such, they
 * operate on relative Labels, not fully qualified Names. We must know the parent name whose subnames
 * they manage in order to index them correctly.
 *
 * Because we use shared indexing logic for each instance of these contracts (BaseRegistrar,
 * RegistrarControllers, NameWrapper), the concept of "which name is this contract operating in the
 * context of" must be generalizable: this is the contract's 'Managed Name'.
 *
 * Concretely, a .eth RegistrarController will emit a _LabelHash_ indicating a new Registration, but
 * correlating that LabelHash with the NameHash of the Name requires knowing the NameHash of the
 * Registrar's Managed Name ('eth' in this case).
 *
 * The NameWrapper contracts are relevant here as well because they include specialized logic for
 * wrapping direct subnames of these Managed Names.
 */

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
 * Mapping of a Managed Name to contracts that operate in the context of said Name.
 */
const CONTRACTS_BY_MANAGED_NAME: Record<Name, AccountId[]> = {
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
    maybeGetDatasourceContract(
      config.namespace, //
      DatasourceNames.Lineanames,
      "BaseRegistrar",
    ),
    maybeGetDatasourceContract(
      config.namespace,
      DatasourceNames.Lineanames,
      "EthRegistrarController",
    ),
    lineanamesNameWrapper,
  ].filter((c) => !!c),
};

/**
 * Certain Managed Names are different depending on the ENSNamespace — this encodes that relationship.
 */
const MANAGED_NAME_BY_NAMESPACE: Partial<Record<ENSNamespaceId, Record<Name, Name>>> = {
  sepolia: {
    "base.eth": "basetest.eth",
    "linea.eth": "linea-sepolia.eth",
  },
};

/**
 * Given a `contract`, identify its Managed Name.
 */
export const getManagedName = (contract: AccountId) => {
  for (const [managedName, contracts] of Object.entries(CONTRACTS_BY_MANAGED_NAME)) {
    const isAnyOfTheContracts = contracts.some((_contract) => accountIdEqual(_contract, contract));
    if (isAnyOfTheContracts) {
      // use the namespace-specific Managed Name if specified, otherwise use the default from CONTRACTS_BY_MANAGED_NAME
      const namespaceSpecificManagedName =
        MANAGED_NAME_BY_NAMESPACE[config.namespace]?.[managedName] ?? managedName;
      return namespaceSpecificManagedName as InterpretedName;
    }
  }

  throw new Error(`The following contract ${toJson(contract)} does not have a Managed Name.`);
};

/**
 * Determines whether `contract` is a NameWrapper.
 */
export function isNameWrapper(contract: AccountId) {
  if (accountIdEqual(ethnamesNameWrapper, contract)) return true;
  if (lineanamesNameWrapper && accountIdEqual(lineanamesNameWrapper, contract)) return true;
  return false;
}

/**
 * Decodes a uint256-encoded-LabelHash (i.e. a tokenId) into a {@link LabelHash}.
 *
 * Remember that contracts that operate in the context of a Managed Name frequently store and operate
 * over _LabelHashes_ that represent a direct subname of a Managed Name. These contracts also frequently
 * implement ERC721 or ERC1155 to represent ownership of these Names. As such, to construct the
 * EC721/ERC1155 tokenId, they encode the direct subnames's LabelHash as a uint256.
 *
 * This is true for the ENSv1 BaseRegistrar, RegistrarControllers, and NameWrapper, as well as any
 * contracts forked from from (which includes Basenames' and Lineanames' implementations).
 *
 * So, in order to turn the tokenId into a LabelHash, we perform the opposite operation, decoding
 * from a uint256 into a Hex (of size 32) and cast it as our semantic {@link LabelHash} type.
 *
 * @see https://github.com/ensdomains/ens-contracts/blob/db613bc/contracts/ethregistrar/ETHRegistrarController.sol#L215
 * @see https://github.com/base/basenames/blob/1b5c1ad/src/L2/RegistrarController.sol#L488
 * @see https://github.com/Consensys/linea-ens/blob/3a4f02f/packages/linea-ens-contracts/contracts/ethregistrar/ETHRegistrarController.sol#L447
 */
export const tokenIdToLabelHash = (tokenId: bigint): LabelHash => uint256ToHex32(tokenId);
