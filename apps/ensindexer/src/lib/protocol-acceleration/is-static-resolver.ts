import config from "@/config";

import { type DatasourceName, DatasourceNames } from "@ensnode/datasources";
import { type AccountId, accountIdEqual } from "@ensnode/ensnode-sdk";

import { maybeGetDatasourceContract } from "@/lib/datasource-helpers";

const makeEq = (b: AccountId) => (datasourceName: DatasourceName, contractName: string) => {
  const a = maybeGetDatasourceContract(config.namespace, datasourceName, contractName);
  return a && accountIdEqual(a, b);
};

/**
 * Returns whether `resolver` is an Static Resolver.
 *
 * Static Resolvers must abide the following pattern:
 * 1. All information necessary for resolution is stored on-chain, and
 * 2. All resolve() calls resolve to the exact value previously emitted by the Resolver in
 *    its events (i.e. no post-processing or other logic, a simple return of the on-chain data).
 *   2.a the Resolver MAY implement address record defaulting and still be considered Static (see below).
 * 3. Its behavior is unlikely to change (i.e. the contract is not upgradable or is unlikely to be
 *   upgraded in a way that violates principles 1. or 2.).
 *
 * TODO: these relationships could be encoded in an ENSIP
 */
export function isStaticResolver(resolver: AccountId): boolean {
  const isResolver = makeEq(resolver);

  return [
    // ENS Root Chain
    isResolver(DatasourceNames.ReverseResolverRoot, "DefaultPublicResolver1"),
    isResolver(DatasourceNames.ReverseResolverRoot, "DefaultPublicResolver2"),
    isResolver(DatasourceNames.ReverseResolverRoot, "DefaultPublicResolver3"),

    // Base Chain
    isResolver(DatasourceNames.Basenames, "L2Resolver1"),
    isResolver(DatasourceNames.Basenames, "L2Resolver2"),
  ].some(Boolean);
}

/**
 * Returns whether `resolver` implements address record defaulting.
 *
 * @see https://docs.ens.domains/ensip/19/#default-address
 */
export function staticResolverImplementsAddressRecordDefaulting(resolver: AccountId): boolean {
  const isResolver = makeEq(resolver);

  return [
    // ENS Root Chain
    isResolver(DatasourceNames.ReverseResolverRoot, "DefaultPublicResolver3"),

    // Base Chain
    isResolver(DatasourceNames.Basenames, "L2Resolver2"),
  ].some(Boolean);
}
