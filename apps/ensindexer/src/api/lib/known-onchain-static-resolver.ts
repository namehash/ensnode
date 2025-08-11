import config from "@/config";
import { DatasourceNames, getDatasourceInAnyNamespace } from "@ensnode/datasources";
import { ChainId } from "@ensnode/ensnode-sdk";
import { Address } from "viem";

// NOTE: we know ensRoot is defined for all namespaces, so enforce that at runtime with !
const ensRoot = getDatasourceInAnyNamespace(config.namespace, DatasourceNames.ENSRoot)!;

/**
 * Returns whether `resolverAddress` on `chainId` is a Known Onchain Static Resolver.
 *
 * Onchain Static Resolvers must abide the following pattern:
 * 1. Onchain: all information necessary for resolution is stored on-chain, and
 * 2. Static: All resolve() calls resolve to the exact value previously emitted by the Resolver in
 *    its events (i.e. no post-processing or other logic, a simple return of the on-chain data).
 * 3. Its behavior is unlikely to change (i.e. the contract is not upgradable or is unlikely to be
 *   upgraded in a way that violates principles 1. or 2.).
 *
 * NOTE: ContractConfig['address'] can be Address | Address[] but we know all of these are just Address
 *
 * TODO: these relationships could/should be encoded in an ENSIP
 */
export function isKnownOnchainStaticResolver(chainId: ChainId, resolverAddress: Address): boolean {
  // on the ENS Deployment Chain
  if (chainId === ensRoot.chain.id) {
    return [
      // the Root LegacyPublicResolver is an Onchain Static Resolver
      ensRoot.contracts.LegacyPublicResolver?.address as Address,

      // the Root PublicResolver is an Onchain Static Resolver
      // NOTE: this is _also_ the ENSIP-11 ReverseResolver (aka DefaultReverseResolver2)
      ensRoot.contracts.PublicResolver?.address as Address,
    ].includes(resolverAddress);
  }

  return false;
}
