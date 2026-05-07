import type { AccountId } from "enssdk";

import { DatasourceNames } from "@ensnode/datasources";
import {
  type ENSNamespaceId,
  getDatasourceContract,
  makeContractMatcher,
} from "@ensnode/ensnode-sdk";

/**
 * Result of a Bridged Resolver detection: the AccountId of the (shadow)Registry the resolver
 * defers to, plus whether that Registry indexes the namegraph from-root (`shadow: true`) or is
 * rooted at the resolver's name (`shadow: false`).
 *
 * For ENSv1 Shadow Registries (Basenames, Lineanames) the L2 contract mirrors the full namegraph
 * from the ENS root. For any future ENSv2 sub-Registry bridges the bridged Registry is rooted at
 * the resolver's name.
 */
export interface BridgedResolverTarget {
  registry: AccountId;
  shadow: boolean;
}

/**
 * For a given `resolver`, if it is a known Bridged Resolver, return the AccountId describing the
 * (shadow)Registry it defers resolution to and a flag indicating whether that Registry indexes
 * the namegraph from-root.
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
 */
export function isBridgedResolver(
  namespace: ENSNamespaceId,
  resolver: AccountId,
): BridgedResolverTarget | null {
  const resolverEq = makeContractMatcher(namespace, resolver);

  // the ENSRoot's BasenamesL1Resolver bridges to the Basenames (shadow)Registry
  if (resolverEq(DatasourceNames.ENSRoot, "BasenamesL1Resolver")) {
    return {
      registry: getDatasourceContract(namespace, DatasourceNames.Basenames, "Registry"),
      shadow: true,
    };
  }

  // the ENSRoot's LineanamesL1Resolver bridges to the Lineanames (shadow)Registry
  if (resolverEq(DatasourceNames.ENSRoot, "LineanamesL1Resolver")) {
    return {
      registry: getDatasourceContract(namespace, DatasourceNames.Lineanames, "Registry"),
      shadow: true,
    };
  }

  // TODO: ThreeDNS

  return null;
}
