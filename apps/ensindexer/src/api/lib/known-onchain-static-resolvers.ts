import config from "@/config";
import { ENSNamespace, getENSNamespace } from "@ensnode/datasources";
import { Address } from "viem";

// NOTE: typing as ENSNamespace so we can access possibly undefined Datasources
const ensNamespace = getENSNamespace(config.namespace) as ENSNamespace;

/**
 * A mapping of chain id to addresses that are known Onchain Static Resolvers
 *
 * These resolvers must abide the following pattern:
 * 1. Onchain: all information necessary for resolution is stored on-chain, and
 * 2. Static: All resolve() calls resolve to the exact value previously emitted by the Resolver in
 *    its events (i.e. no post-processing or other logic, a simple return of the on-chain data).
 * 3. Its behavior is unlikely to change (i.e. the contract is not upgradable or is unlikely to be
 *   upgraded in a way that violates principles 1. or 2.).
 *
 * We build this object at runtime based on conditionally available Datasources.
 *
 * TODO: these relationships could/should be encoded in an ENSIP
 */
export const KNOWN_ONCHAIN_STATIC_RESOLVERS: Record<number, Address[]> = {
  // on the ENS Deployment Chain
  [ensNamespace.ensroot.chain.id]: [
    // the Root LegacyPublicResolver is an Onchain Static Resolver
    ensNamespace.ensroot.contracts.LegacyPublicResolver?.address as Address,

    // the Root PublicResolver is an Onchain Static Resolver
    // NOTE: this is also the ENSIP-11 ReverseResolver
    ensNamespace.ensroot.contracts.PublicResolver?.address as Address,

    // the Root LegacyDefaultReverseResolver is an Onchain Static Resolver
    ensNamespace["reverse-resolver-root"]?.contracts.LegacyDefaultReverseResolver
      ?.address as Address,
  ].filter(Boolean),

  // on the Basenames chain
  ...(!!ensNamespace["reverse-resolver-base"] && {
    [ensNamespace["reverse-resolver-base"].chain.id]: [
      // the Basenames L2Resolver is an Onchain Static Resolver
      ensNamespace["reverse-resolver-base"].contracts.L2Resolver?.address as Address,

      // the ENSIP-11 ReverseResolver is an Onchain Static Resolver
      ensNamespace["reverse-resolver-base"].contracts.ReverseResolver?.address as Address,
    ].filter(Boolean),
  }),

  // on Linea chain
  ...(!!ensNamespace["reverse-resolver-linea"] && {
    [ensNamespace["reverse-resolver-linea"].chain.id]: [
      // TODO: additional Linea Onchain Static Resolver? like a PublicResolver equivalent

      // the ENSIP-11 ReverseResolver is an Onchain Static Resolver
      ensNamespace["reverse-resolver-linea"].contracts.ReverseResolver?.address as Address,
    ].filter(Boolean),
  }),

  // on Optimism chain
  ...(!!ensNamespace["reverse-resolver-optimism"] && {
    [ensNamespace["reverse-resolver-optimism"].chain.id]: [
      // the ENSIP-11 ReverseResolver is an Onchain Static Resolver
      ensNamespace["reverse-resolver-optimism"].contracts.ReverseResolver?.address as Address,
    ].filter(Boolean),
  }),

  // on Arbitrum chain
  ...(!!ensNamespace["reverse-resolver-arbitrum"] && {
    [ensNamespace["reverse-resolver-arbitrum"].chain.id]: [
      // the ENSIP-11 ReverseResolver is an Onchain Static Resolver
      ensNamespace["reverse-resolver-arbitrum"].contracts.ReverseResolver?.address as Address,
    ].filter(Boolean),
  }),

  // on Scroll chain
  ...(!!ensNamespace["reverse-resolver-scroll"] && {
    [ensNamespace["reverse-resolver-scroll"].chain.id]: [
      // the ENSIP-11 ReverseResolver is an Onchain Static Resolver
      ensNamespace["reverse-resolver-scroll"].contracts.ReverseResolver?.address as Address,
    ].filter(Boolean),
  }),
};
