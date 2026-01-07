import { DatasourceNames } from "@ensnode/datasources";
import { type AccountId, type ENSNamespaceId, makeContractMatcher } from "@ensnode/ensnode-sdk";

/**
 * ENSIP-19 Reverse Resolvers (i.e. DefaultReverseResolver or ChainReverseResolver) simply:
 *  a. read the Name for their specific coinType from their connected StandaloneReverseRegistry, or
 *  b. return the default coinType's Name.
 *
 * We encode this behavior here, for the purposes of Protocol Acceleration.
 */
export function isKnownENSIP19ReverseResolver(
  namespace: ENSNamespaceId,
  resolver: AccountId,
): boolean {
  const resolverEq = makeContractMatcher(namespace, resolver);

  return [
    // DefaultReverseResolver (default.reverse)
    resolverEq(DatasourceNames.ReverseResolverRoot, "DefaultReverseResolver3"),

    // the following are each ChainReverseResolver ([coinType].reverse)
    resolverEq(DatasourceNames.ReverseResolverRoot, "BaseReverseResolver"),
    resolverEq(DatasourceNames.ReverseResolverRoot, "LineaReverseResolver"),
    resolverEq(DatasourceNames.ReverseResolverRoot, "OptimismReverseResolver"),
    resolverEq(DatasourceNames.ReverseResolverRoot, "ArbitrumReverseResolver"),
    resolverEq(DatasourceNames.ReverseResolverRoot, "ScrollReverseResolver"),
  ].some(Boolean);
}
