import config from "@/config";

import type { Address } from "viem";

import { type ContractConfig, type ENSNamespace, getENSNamespace } from "@ensnode/datasources";
import { type AccountId, accountIdEqual } from "@ensnode/ensnode-sdk";

const namespace = getENSNamespace(config.namespace) as ENSNamespace;

type ContractConfigWithSingleAddress = ContractConfig & { address: Address };
const hasSingleAddress = (
  contractConfig: ContractConfig | undefined,
): contractConfig is ContractConfigWithSingleAddress =>
  !!contractConfig?.address && typeof contractConfig.address === "string";

/**
 * For a given `resolver`, if it is a known CCIP-Read Shadow Registry Resolver, return the
 * AccountId describing the (shadow)Registry it defers resolution to.
 *
 * These CCIP-Read Shadow Registry Resolvers must abide the following pattern:
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
 * TODO: these relationships could/should be encoded in an ENSIP, likely as a mapping from
 * resolverAddress to (shadow)Registry on a specified chain.
 */
export function possibleKnownCCIPReadShadowRegistryResolverDefersTo(
  resolver: AccountId,
): AccountId | null {
  const { ensroot, basenames, lineanames } = namespace;

  if (
    basenames &&
    hasSingleAddress(basenames.contracts.Registry) &&
    hasSingleAddress(ensroot.contracts.BasenamesL1Resolver)
  ) {
    // the ENSRoot's BasenamesL1Resolver defers to the Basenames (shadow)Registry
    const isBasenamesL1Resolver = accountIdEqual(resolver, {
      chainId: ensroot.chain.id,
      address: ensroot.contracts.BasenamesL1Resolver.address,
    });

    if (isBasenamesL1Resolver) {
      return {
        chainId: basenames.chain.id,
        address: basenames.contracts.Registry.address,
      };
    }
  }

  if (
    lineanames &&
    hasSingleAddress(lineanames.contracts.Registry) &&
    hasSingleAddress(ensroot.contracts.LineanamesL1Resolver)
  ) {
    // the ENSRoot's LineanamesL1Resolver defers to the Lineanames (shadow)Registry
    const isLineanamesL1Resolver = accountIdEqual(resolver, {
      chainId: ensroot.chain.id,
      address: ensroot.contracts.LineanamesL1Resolver.address,
    });

    if (isLineanamesL1Resolver) {
      return {
        chainId: lineanames.chain.id,
        address: lineanames.contracts.Registry.address,
      };
    }
  }

  // TODO: ThreeDNS

  return null;
}
