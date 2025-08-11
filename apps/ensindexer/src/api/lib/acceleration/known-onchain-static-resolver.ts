import config from "@/config";
import { DatasourceNames, getDatasourceInAnyNamespace } from "@ensnode/datasources";
import { ChainId } from "@ensnode/ensnode-sdk";
import { Address } from "viem";

const rrRoot = getDatasourceInAnyNamespace(config.namespace, DatasourceNames.ReverseResolverRoot);

/**
 * Returns whether `resolverAddress` on `chainId` is a Known Onchain Static Resolver.
 *
 * Onchain Static Resolvers must abide the following pattern:
 * 1. Onchain: all information necessary for resolution is stored on-chain, and
 * 2. Static: All resolve() calls resolve to the exact value previously emitted by the Resolver in
 *    its events (i.e. no post-processing or other logic, a simple return of the on-chain data).
 *   2.a the Resolver MAY implement address record defaulting and still be considered Static (see below).
 * 3. Its behavior is unlikely to change (i.e. the contract is not upgradable or is unlikely to be
 *   upgraded in a way that violates principles 1. or 2.).
 *
 * NOTE: ContractConfig['address'] can be Address | Address[] but we know all of these are just Address
 *
 * TODO: these relationships could be encoded in an ENSIP
 */
export function isKnownOnchainStaticResolver(chainId: ChainId, resolverAddress: Address): boolean {
  // on the ENS Deployment Chain
  if (chainId === rrRoot?.chain.id) {
    return [
      // the Root LegacyDefaultResolver is an Onchain Static Resolver
      rrRoot.contracts.DefaultPublicResolver1?.address,

      // NOTE: this is _also_ the ENSIP-11 ReverseResolver (aka DefaultReverseResolver2)
      rrRoot.contracts.DefaultPublicResolver2?.address,

      // the ENSIP-19 default PublicResolver is an Onchain Static Resolver
      rrRoot.contracts.DefaultPublicResolver3?.address,
    ]
      .filter((address): address is Address => !!address)
      .includes(resolverAddress);
  }

  return false;
}

/**
 * Returns whether `resolverAddress` on `chainId` implements address record defaulting.
 *
 * @see https://docs.ens.domains/ensip/19/#default-address
 */
export function onchainStaticResolverImplementsDefaultAddress(
  chainId: ChainId,
  resolverAddress: Address,
): boolean {
  if (chainId === rrRoot?.chain.id) {
    return [
      // the DefaultPublicResolver3 (ENSIP-19 default PublicResolver) implements address defaulting
      rrRoot.contracts.DefaultPublicResolver3?.address,
    ]
      .filter((address): address is Address => !!address)
      .includes(resolverAddress);
  }

  return false;
}
