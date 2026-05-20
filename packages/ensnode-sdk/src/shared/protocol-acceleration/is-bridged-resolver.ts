import {
  type AccountId,
  type DomainId,
  makeENSv1DomainId,
  makeENSv1VirtualRegistryId,
  type RegistryId,
} from "enssdk";

import { DatasourceNames, maybeGetDatasource } from "@ensnode/datasources";
import {
  accountIdEqual,
  type ENSNamespaceId,
  getDatasourceContract,
  getENSv1RootRegistry,
  getManagedName,
} from "@ensnode/ensnode-sdk";

// simple cache of BridgedResolverConfig by namespace because it's in an indexing hot-path
const cache = new Map<ENSNamespaceId, BridgedResolverConfig[]>();

/**
 * Describes a Bridged Resolver's origin Domain and target Registry.
 */
export interface BridgedResolverConfig {
  /**
   * The Bridged Resolver connecting the origin Domain to the target Registry.
   */
  resolver: AccountId;

  /**
   * The DomainId of the _legitimate_ originating Domain on the ENS Root chain whose
   * Bridged Resolver attachment canonicalizes the bridged target Registry. Anyone can set a
   * known Bridged Resolver (e.g. `BasenamesL1Resolver`) as their resolver, but only the
   * originating Domain (e.g. mainnet `base.eth`) is the canonical parent of the bridged
   * target Registry.
   */
  originDomainId: DomainId;

  /**
   * The RegistryId of the _specific_ (Concrete or Virtual) Registry to which the Bridged Resolver defers.
   */
  targetRegistryId: RegistryId;

  /**
   * The AccountId of the Concrete Registry to which the Bridged Resolver defers, necessary for
   * current ENSv1 Protocol Acceleration implementation.
   * TODO: refactor Protocol Acceleration to operate over RegistryId instead of AccountId.
   */
  targetRegistry: AccountId;
}

/**
 * Constructs the known Bridged Resolver Configurations for the provided `namespace`.
 *
 * These Bridged Resolvers must abide the following pattern:
 * 1. They _always_ emit OffchainLookup for any resolve() call to a well-known CCIP-Read Gateway,
 * 2. That CCIP-Read Gateway exclusively consults a specific (shadow)Registry in order to identify
 *   a name's active resolver and resolve records, and
 * 3. Its behavior is unlikely to change (i.e. the contract is not upgradable or is unlikely to be
 *   upgraded in a way that violates principles 1. or 2.).
 *
 * The goal is to encode the pattern followed by projects like Basenames and Lineanames where a
 * wildcard resolver is used for subnames of base.eth and that L1Resolver always returns OffchainLookup
 * instructing the caller to consult a well-known CCIP-Read Gateway. This CCIP-Read Gateway then
 * exclusively behaves in the following way: it identifies the name's active resolver via a well-known
 * (shadow)Registry (likely on an L2), and resolves records on that active resolver.
 *
 * In these cases, if the Node-Resolver relationships for the (shadow)Registry in question are indexed,
 * then the CCIP-Read can be short-circuited, in favor of performing an _accelerated_ Forward Resolution
 * against the (shadow)Registry in question.
 *
 * TODO: these relationships could/should be encoded in an ENSIP
 * TODO: once Forward Resolution is updated for ENSv2, this likely just returns RegistryId
 */
const getBridgedResolverConfigs = (namespace: ENSNamespaceId): BridgedResolverConfig[] => {
  const cached = cache.get(namespace);
  if (cached) return cached;

  const configs: BridgedResolverConfig[] = [];

  const basenames = maybeGetDatasource(namespace, DatasourceNames.Basenames);
  if (basenames) {
    const resolver = getDatasourceContract(
      namespace,
      DatasourceNames.ENSRoot,
      "BasenamesL1Resolver",
    );
    const registry = getDatasourceContract(namespace, DatasourceNames.Basenames, "Registry");
    const { node } = getManagedName(namespace, registry);
    configs.push({
      resolver,
      originDomainId: makeENSv1DomainId(getENSv1RootRegistry(namespace), node),
      targetRegistry: registry,
      targetRegistryId: makeENSv1VirtualRegistryId(registry, node),
    });
  }

  const lineanames = maybeGetDatasource(namespace, DatasourceNames.Lineanames);
  if (lineanames) {
    const resolver = getDatasourceContract(
      namespace,
      DatasourceNames.ENSRoot,
      "LineanamesL1Resolver",
    );
    const registry = getDatasourceContract(namespace, DatasourceNames.Lineanames, "Registry");
    const { node } = getManagedName(namespace, registry);
    configs.push({
      resolver,
      originDomainId: makeENSv1DomainId(getENSv1RootRegistry(namespace), node),
      targetRegistry: registry,
      targetRegistryId: makeENSv1VirtualRegistryId(registry, node),
    });
  }

  cache.set(namespace, configs);

  return configs;
};

/**
 * For a given `resolver`, if it is a known Bridged Resolver, return its Bridged Resolver Config.
 */
export function isBridgedResolver(
  namespace: ENSNamespaceId,
  resolver: AccountId,
): BridgedResolverConfig | null {
  return (
    getBridgedResolverConfigs(namespace).find((config) =>
      accountIdEqual(config.resolver, resolver),
    ) ?? null
  );
}

/**
 * Returns true iff `domainId` is the origin Domain of a known Bridged Resolver.
 *
 * `Domain.subregistryId` on a bridge origin (e.g. mainnet `base.eth`, `linea.eth`) is owned by
 * `handleBridgedResolverChange` — it must point at the bridged target Registry on the L2 chain
 * so the canonical edge to that target Registry can agree. Chain-local subname events on the
 * origin Domain must not overwrite that pointer.
 */
export function isBridgedOriginDomain(
  namespace: ENSNamespaceId,
  domainId: DomainId,
): BridgedResolverConfig | null {
  return (
    getBridgedResolverConfigs(namespace).find((config) => config.originDomainId === domainId) ??
    null
  );
}

/**
 * Returns true iff `registryId` is the target Registry of a known Bridged Resolver.
 *
 * `Registry.canonicalDomainId` on a bridged target (e.g. the Basenames/Lineanames L2 Registries)
 * is owned by `handleBridgedResolverChange` — it must point at the mainnet origin Domain so the
 * canonical edge can agree. Chain-local subname events on the target Registry must not overwrite
 * that pointer with the L2-side Domain ID.
 */
export function isBridgedTargetRegistry(
  namespace: ENSNamespaceId,
  registryId: RegistryId,
): BridgedResolverConfig | null {
  return (
    getBridgedResolverConfigs(namespace).find((config) => config.targetRegistryId === registryId) ??
    null
  );
}
