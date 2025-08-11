import config from "@/config";
import { DatasourceNames, getDatasourceInAnyNamespace } from "@ensnode/datasources";
import { ChainId } from "@ensnode/ensnode-sdk";
import { Address } from "viem";

const rrRoot = getDatasourceInAnyNamespace(config.namespace, DatasourceNames.ReverseResolverRoot);

/**
 * ENSIP-19 Reverse Resolvers (i.e. DefaultReverseResolver or ChainReverseResolver) simply:
 *  a. read the Name for their specific coinType from their connected StandaloneReverseRegistry, or
 *  b. return the default coinType's Name.
 *
 * We encode this behavior here, for the purposes of Protocol Acceleration.
 */
export function isKnownENSIP19ReverseResolver(chainId: ChainId, resolverAddress: Address): boolean {
  if (chainId === rrRoot?.chain.id) {
    return [
      // DefaultReverseResolver (default.reverse)
      rrRoot?.contracts.DefaultReverseResolver3?.address,
      // the following are each ChainReverseResolver ([coinType].reverse)
      rrRoot?.contracts.BaseReverseResolver?.address,
      rrRoot?.contracts.LineaReverseResolver?.address,
      rrRoot?.contracts.OptimismReverseResolver?.address,
      rrRoot?.contracts.ArbitrumReverseResolver?.address,
      rrRoot?.contracts.ScrollReverseResolver?.address,
    ]
      .filter((address): address is Address => !!address)
      .includes(resolverAddress);
  }

  // NOTE: ENSIP-19 Reverse Resolvers are only valid in the context of the ENS Root chain

  return false;
}
