import config from "@/config";

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
import {
  accountIdEqual,
  getDatasourceContract,
  maybeGetDatasourceContract,
} from "@ensnode/ensnode-sdk";

import { toJson } from "@/lib/json-stringify-with-bigints";

/**
 * Many contracts within the ENSv1 Ecosystem are relative to a parent Name. For example,
 * the .eth BaseRegistrar (and RegistrarControllers) manage direct subnames of .eth. As such, they
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
 * wrapping direct subnames of specific Managed Names.
 */

const ensRootRegistry = getDatasourceContract(
  config.namespace,
  DatasourceNames.ENSRoot,
  "ENSv1Registry",
);
const ensRootRegistryOld = getDatasourceContract(
  config.namespace,
  DatasourceNames.ENSRoot,
  "ENSv1RegistryOld",
);
const ethnamesNameWrapper = getDatasourceContract(
  config.namespace,
  DatasourceNames.ENSRoot,
  "NameWrapper",
);

const basenamesRegistry = maybeGetDatasourceContract(
  config.namespace,
  DatasourceNames.Basenames,
  "Registry",
);
const lineanamesRegistry = maybeGetDatasourceContract(
  config.namespace,
  DatasourceNames.Lineanames,
  "Registry",
);
const lineanamesNameWrapper = maybeGetDatasourceContract(
  config.namespace,
  DatasourceNames.Lineanames,
  "NameWrapper",
);

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
 * Mapping of a Managed Name to its concrete Registry and the contracts that operate in its
 * (sub)Registry context.
 *
 * The concrete ENSv1 Registry is included in `contracts` so that its own handlers resolve via the
 * same {@link getManagedName} path. The mainnet ENSv1Registry's Managed Name is the ENS Root (""),
 * so direct children of root (TLDs) point at the concrete Registry and everything below gets a
 * virtual Registry.
 *
 * Groups for namespaces that don't ship a given shadow Registry are omitted entirely.
 */
const CONTRACTS_BY_MANAGED_NAME: Record<Name, ManagedNameGroup> = {
  [ENS_ROOT_NAME]: {
    registry: ensRootRegistry,
    contracts: [ensRootRegistry, ensRootRegistryOld],
  },
  eth: {
    registry: ensRootRegistry,
    contracts: [
      getDatasourceContract(config.namespace, DatasourceNames.ENSRoot, "BaseRegistrar"),
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
      getDatasourceContract(
        config.namespace,
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
        maybeGetDatasourceContract(config.namespace, DatasourceNames.Basenames, "BaseRegistrar"),
        maybeGetDatasourceContract(
          config.namespace,
          DatasourceNames.Basenames,
          "EARegistrarController",
        ),
        maybeGetDatasourceContract(
          config.namespace,
          DatasourceNames.Basenames,
          "RegistrarController",
        ),
        maybeGetDatasourceContract(
          config.namespace,
          DatasourceNames.Basenames,
          "UpgradeableRegistrarController",
        ),
      ].filter((c) => !!c),
    } satisfies ManagedNameGroup,
  }),
  ...(lineanamesRegistry && {
    "linea.eth": {
      registry: lineanamesRegistry,
      contracts: [
        lineanamesRegistry,
        maybeGetDatasourceContract(config.namespace, DatasourceNames.Lineanames, "BaseRegistrar"),
        maybeGetDatasourceContract(
          config.namespace,
          DatasourceNames.Lineanames,
          "EthRegistrarController",
        ),
        lineanamesNameWrapper,
      ].filter((c) => !!c),
    } satisfies ManagedNameGroup,
  }),
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

// Because we access a contract's Managed Name (and Node) frequently in event handlers, it's likely
// that caching the namehash() fn for these few values is beneficial, so we do so here.
const namehashCache = new Map<Name, Node>();
const cachedNamehash = (name: Name): Node => {
  const cached = namehashCache.get(name);
  if (cached !== undefined) return cached;

  const node = namehashInterpretedName(asInterpretedName(name));
  namehashCache.set(name, node);
  return node;
};

/**
 * Given a `contract`, identify its Managed Name, Node, and the concrete ENSv1 Registry whose
 * namegraph it writes into.
 *
 * @dev Caches the result of namehash(name).
 */
export const getManagedName = (
  contract: AccountId,
): { name: InterpretedName; node: Node; registry: AccountId } => {
  for (const [managedName, group] of Object.entries(CONTRACTS_BY_MANAGED_NAME)) {
    const isAnyOfTheContracts = group.contracts.some((_contract) =>
      accountIdEqual(_contract, contract),
    );
    if (isAnyOfTheContracts) {
      const namespaceSpecific = MANAGED_NAME_BY_NAMESPACE[config.namespace]?.[managedName];

      // use the namespace-specific Managed Name if specified, otherwise use the default from CONTRACTS_BY_MANAGED_NAME
      // NOTE: we cast to InterpretedName directly to avoid the overhead of asInterpretedName and
      // both namespaceSpecific and managedName are guaranteed to be InterpretedName (see above)
      const name = (namespaceSpecific ?? managedName) as InterpretedName;
      const node = cachedNamehash(name);

      return { name, node, registry: group.registry };
    }
  }

  throw new Error(
    `The following contract ${toJson(contract)} does not have a configured Managed Name. See apps/ensindexer/src/lib/managed-names.ts.`,
  );
};

/**
 * Determines whether `contract` is a NameWrapper.
 */
export function isNameWrapper(contract: AccountId) {
  if (accountIdEqual(ethnamesNameWrapper, contract)) return true;
  if (lineanamesNameWrapper && accountIdEqual(lineanamesNameWrapper, contract)) return true;
  return false;
}
