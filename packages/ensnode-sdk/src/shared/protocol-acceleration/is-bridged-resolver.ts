import {
  type AccountId,
  type ChainId,
  makeENSv1VirtualRegistryId,
  type Node,
  type NormalizedAddress,
  type RegistryId,
} from "enssdk";

import { DatasourceNames } from "@ensnode/datasources";
import {
  type ENSNamespaceId,
  getDatasourceContract,
  makeContractMatcher,
} from "@ensnode/ensnode-sdk";

/**
 * Rich description of a Bridged Resolver's target (shadow)Registry. Provides both:
 *  - canonicality wiring at index time (`{ id, type, chainId, address, node }` for upserting), and
 *  - canonical-namegraph forward traversal at query time (`id` alone), and
 *  - the bridged target as an AccountId (`{ chainId, address }`) for Forward Resolution recursion.
 *
 * Currently only ENSv1VirtualRegistry shadow registries (Basenames, Lineanames) are supported;
 * future ENSv2 sub-registry bridges will use `type: "ENSv2Registry"`.
 */
export type BridgedResolverRegistry =
  | {
      id: RegistryId;
      type: "ENSv1VirtualRegistry";
      chainId: ChainId;
      address: NormalizedAddress;
      node: Node;
    }
  | {
      id: RegistryId;
      type: "ENSv2Registry";
      chainId: ChainId;
      address: NormalizedAddress;
    };

/**
 * For a given `resolver`, if it is a known Bridged Resolver, return the (shadow)Registry it defers
 * resolution to. The `originatingNode` is the Node of the Domain whose Resolver is being inspected,
 * required for shadow-virtual-registry id construction.
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
  originatingNode: Node,
): BridgedResolverRegistry | null {
  const resolverEq = makeContractMatcher(namespace, resolver);

  // the ENSRoot's BasenamesL1Resolver bridges to the Basenames (shadow)Registry
  if (resolverEq(DatasourceNames.ENSRoot, "BasenamesL1Resolver")) {
    const target = getDatasourceContract(namespace, DatasourceNames.Basenames, "Registry");
    return {
      id: makeENSv1VirtualRegistryId(target, originatingNode),
      type: "ENSv1VirtualRegistry",
      chainId: target.chainId,
      address: target.address,
      node: originatingNode,
    };
  }

  // the ENSRoot's LineanamesL1Resolver bridges to the Lineanames (shadow)Registry
  if (resolverEq(DatasourceNames.ENSRoot, "LineanamesL1Resolver")) {
    const target = getDatasourceContract(namespace, DatasourceNames.Lineanames, "Registry");
    return {
      id: makeENSv1VirtualRegistryId(target, originatingNode),
      type: "ENSv1VirtualRegistry",
      chainId: target.chainId,
      address: target.address,
      node: originatingNode,
    };
  }

  // TODO: ThreeDNS

  return null;
}
