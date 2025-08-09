import config from "@/config";
import { DatasourceNames, getDatasourceInAnyNamespace } from "@ensnode/datasources";
import { Address } from "viem";

const rrRoot = getDatasourceInAnyNamespace(config.namespace, DatasourceNames.ReverseResolverRoot);

const KNOWN_ENSIP19_REVERSE_RESOLVERS = [
  // DefaultReverseResolver (default.reverse)
  rrRoot?.contracts.DefaultReverseResolver3?.address,
  // the following are each ChainReverseResolver ([coinType].reverse)
  rrRoot?.contracts.BaseReverseResolver?.address,
  rrRoot?.contracts.LineaReverseResolver?.address,
  rrRoot?.contracts.OptimismReverseResolver?.address,
  rrRoot?.contracts.ArbitrumReverseResolver?.address,
  rrRoot?.contracts.ScrollReverseResolver?.address,
].filter((address): address is Address => !!address);

/**
 * ENSIP-19 Reverse Resolvers (i.e. DefaultReverseResolver or ChainReverseResolver) simply:
 *  a. read the Name for their specific coinType from their connected StandaloneReverseRegistry, or
 *  b. return the default coinType's Name.
 *
 * We encode this behavior here, for the purposes of Protocol Acceleration.
 */
export function isKnownENSIP19ReverseResolver(resolverAddress: Address): boolean {
  return KNOWN_ENSIP19_REVERSE_RESOLVERS.includes(resolverAddress);
}
