import {
  type AccountId,
  asInterpretedName,
  ENS_ROOT_NAME,
  type InterpretedName,
  type Name,
  type Node,
  namehashInterpretedName,
} from "enssdk";

import { DatasourceNames, type ENSNamespaceId } from "@ensnode/datasources";

import { accountIdEqual } from "./account-id";
import { getDatasourceContract, maybeGetDatasourceContract } from "./datasource-contract";
import { toJson } from "./to-json";

/**
 * Many contracts within the ENSv1 Ecosystem are relative to a parent Name. For example,
 * the .eth BaseRegistrar (and RegistrarControllers) manage direct subnames of .eth. As such, they
 * operate on relative Labels, not fully qualified Names. We must know the parent name whose subnames
 * they manage in order to index them correctly.
 *
 * Because we use shared indexing logic for each instance of these contracts (BaseRegistrar,
 * RegistrarControllers, NameWrapper), the concept of "which name is this contract operating in
 * the context of" must be generalizable: this is the contract's 'Managed Name'.
 *
 * Concretely, a .eth RegistrarController will emit a _LabelHash_ indicating a new Registration, but
 * correlating that LabelHash with the NameHash of the Name requires knowing the NameHash of the
 * Registrar's Managed Name ('eth' in this case).
 *
 * The NameWrapper contracts are relevant here as well because they include specialized logic for
 * wrapping direct subnames of specific Managed Names.
 */

/**
 * Each Managed Name group is associated with exactly one concrete ENSv1 Registry (the mainnet ENS
 * Registry, the Basenames shadow Registry, or the Lineanames shadow Registry). The Registry is
 * what `handleNewOwner` writes domains into and what every Registrar/Controller/NameWrapper under
 * the same Managed Name contributes to.
 */
interface ManagedNameGroup {
  registry: AccountId;
  contracts: AccountId[];
}

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
 * Produces a mapping of a Managed Name to its concrete Registry and the contracts that operate in
 * its (sub)Registry context.
 *
 * The concrete ENSv1 Registry is included in `contracts` so that its own handlers resolve via the
 * same {@link getManagedName} path.
 */
const getContractsByManagedName = (namespace: ENSNamespaceId) => {
  const ensRootRegistry = getDatasourceContract(
    namespace,
    DatasourceNames.ENSRoot,
    "ENSv1Registry",
  );
  const ensRootRegistryOld = getDatasourceContract(
    namespace,
    DatasourceNames.ENSRoot,
    "ENSv1RegistryOld",
  );
  const ethnamesNameWrapper = getDatasourceContract(
    namespace,
    DatasourceNames.ENSRoot,
    "NameWrapper",
  );

  const basenamesRegistry = maybeGetDatasourceContract(
    namespace,
    DatasourceNames.Basenames,
    "Registry",
  );
  const lineanamesRegistry = maybeGetDatasourceContract(
    namespace,
    DatasourceNames.Lineanames,
    "Registry",
  );
  const lineanamesNameWrapper = maybeGetDatasourceContract(
    namespace,
    DatasourceNames.Lineanames,
    "NameWrapper",
  );

  return {
    [ENS_ROOT_NAME]: {
      registry: ensRootRegistry,
      contracts: [ensRootRegistry, ensRootRegistryOld],
    },
    eth: {
      registry: ensRootRegistry,
      contracts: [
        getDatasourceContract(namespace, DatasourceNames.ENSRoot, "BaseRegistrar"),
        getDatasourceContract(namespace, DatasourceNames.ENSRoot, "LegacyEthRegistrarController"),
        getDatasourceContract(namespace, DatasourceNames.ENSRoot, "WrappedEthRegistrarController"),
        getDatasourceContract(
          namespace,
          DatasourceNames.ENSRoot,
          "UnwrappedEthRegistrarController",
        ),
        getDatasourceContract(
          namespace,
          DatasourceNames.ENSRoot,
          "UniversalRegistrarRenewalWithReferrer",
        ),
        ethnamesNameWrapper,
      ],
    },
    ...(basenamesRegistry && {
      "base.eth": {
        registry: basenamesRegistry,
        contracts: [
          basenamesRegistry,
          maybeGetDatasourceContract(namespace, DatasourceNames.Basenames, "BaseRegistrar"),
          maybeGetDatasourceContract(namespace, DatasourceNames.Basenames, "EARegistrarController"),
          maybeGetDatasourceContract(namespace, DatasourceNames.Basenames, "RegistrarController"),
          maybeGetDatasourceContract(
            namespace,
            DatasourceNames.Basenames,
            "UpgradeableRegistrarController",
          ),
        ].filter((c): c is AccountId => !!c),
      },
    }),
    ...(lineanamesRegistry && {
      "linea.eth": {
        registry: lineanamesRegistry,
        contracts: [
          lineanamesRegistry,
          maybeGetDatasourceContract(namespace, DatasourceNames.Lineanames, "BaseRegistrar"),
          maybeGetDatasourceContract(
            namespace,
            DatasourceNames.Lineanames,
            "EthRegistrarController",
          ),
          lineanamesNameWrapper,
        ].filter((c): c is AccountId => !!c),
      },
    }),
  } satisfies Record<Name, ManagedNameGroup>;
};

// Cache of namehash(name) — interpreted names namehash identically regardless of namespace.
const namehashCache = new Map<Name, Node>();
const cachedNamehash = (name: Name): Node => {
  const cached = namehashCache.get(name);
  if (cached !== undefined) return cached;

  const node = namehashInterpretedName(asInterpretedName(name));
  namehashCache.set(name, node);
  return node;
};

/**
 * Given a `contract` in a `namespace`, identify its Managed Name, Node, and the concrete ENSv1
 * Registry whose namegraph it writes into.
 *
 * @dev Caches the result of namehash(name).
 * @throws if `contract` is not configured under any Managed Name for `namespace`.
 */
export const getManagedName = (
  namespace: ENSNamespaceId,
  contract: AccountId,
): { name: InterpretedName; node: Node; registry: AccountId } => {
  for (const [managedName, group] of Object.entries(getContractsByManagedName(namespace))) {
    const isAnyOfTheContracts = group.contracts.some((_contract) =>
      accountIdEqual(_contract, contract),
    );
    if (isAnyOfTheContracts) {
      const namespaceSpecific = MANAGED_NAME_BY_NAMESPACE[namespace]?.[managedName];
      // use the namespace-specific Managed Name if specified, otherwise the default
      // NOTE: we cast to InterpretedName directly to avoid the overhead of asInterpretedName;
      // both namespaceSpecific and managedName are guaranteed to be InterpretedName (see above)
      const name = (namespaceSpecific ?? managedName) as InterpretedName;
      const node = cachedNamehash(name);

      return { name, node, registry: group.registry };
    }
  }

  throw new Error(
    `The following contract ${toJson(contract, { pretty: true })} does not have a configured Managed Name in namespace '${namespace}'.`,
  );
};

/**
 * Determines whether `contract` is a NameWrapper in the given `namespace`.
 */
export const isNameWrapper = (namespace: ENSNamespaceId, contract: AccountId): boolean => {
  const ethnamesNameWrapper = getDatasourceContract(
    namespace,
    DatasourceNames.ENSRoot,
    "NameWrapper",
  );
  if (accountIdEqual(ethnamesNameWrapper, contract)) return true;

  const lineanamesNameWrapper = maybeGetDatasourceContract(
    namespace,
    DatasourceNames.Lineanames,
    "NameWrapper",
  );
  if (lineanamesNameWrapper && accountIdEqual(lineanamesNameWrapper, contract)) return true;

  return false;
};
