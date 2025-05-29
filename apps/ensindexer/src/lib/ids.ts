import config from "@/config";
import { type LabelHash, type Node } from "@ensnode/ensnode-sdk";
import type { Address } from "viem";

/**
 * Makes a unique, chain-scoped resolver ID.
 * In Subgraph-compatibility mode, no chainId prefix is used (subgraph-compat).
 *
 * @example Subgraph-compat: `${address}-${node}`
 * @example Otherwise (chain-scoped): `${chainId}-${address}-${node}`
 *
 * @param chainId the chain ID
 * @param address the resolver contract address
 * @param node the ENS node
 * @returns a unique resolver ID
 */

export const makeResolverId = (chainId: number, address: Address, node: Node) =>
  [
    // null out chainId prefix iff subgraph-compat, otherwise include for chain-scoping
    config.isSubgraphCompatible ? null : chainId,
    // NOTE: subgraph uses lowercase address here, viem provides us checksummed, so we lowercase it
    address.toLowerCase(),
    node,
  ]
    .filter(Boolean)
    .join("-");

/**
 * Makes a unique, chain-scoped event ID.
 * In Subgraph-compatibility mode, no chainId prefix is used (subgraph-compat).
 *
 * @example Subgraph-compat: `${blockNumber}-${logIndex}(-${transferIndex})`
 * @example Otherwise (chain-scoped): `${chainId}-${blockNumber}-${logIndex}(-${transferIndex})`
 *
 * @param chainId
 * @param blockNumber
 * @param logIndex
 * @param transferIndex
 * @returns
 */
export const makeEventId = (
  chainId: number,
  blockNumber: bigint,
  logIndex: number,
  transferIndex?: number,
) =>
  [
    // null out chainId prefix iff subgraph plugin, otherwise include for chain-scoping
    config.isSubgraphCompatible ? null : chainId,
    blockNumber.toString(),
    logIndex.toString(),
    transferIndex?.toString(),
  ]
    .filter(Boolean)
    .join("-");

/**
 * Makes a cross-registrar unique registration ID.
 *
 * The ENS Subgraph only indexes Registration entities for a single registrar: the registrar for
 * direct subnames of ".eth". It uses the labelHash of each registered ".eth" subname to
 * form a unique Registration id.
 *
 * Because ENSIndexer supports indexing multiple Registrar contracts via plugins
 * (currently using the shared handlers modelled after the Subgraph's indexing logic), however,
 * additional Registration entities may be created. A unique ID other than labelHash is necessary,
 * otherwise Registration entities for the same label would collide.
 *
 * To avoid collisions, if the caller identifies as the subgraph plugin, we use the Domain's `labelHash`
 * (subgraph compat). Otherwise, for any other plugin, we use the Domain's `node`, which is
 * globally unique within ENS.
 *
 * We knowingly mix `labelHash` (labelhash) and `node` (namehash) values as registration ids:
 * both result in keccak256 hashes (the odds of a collision being practically zero) and are derived
 * differently — the result of `namehash` will never (practically zero) collide with the result of
 * `labelhash` because `namehash` always includes the recursive hashing of the root node.
 *
 * For the "v1" of ENSIndexer (at a minimum) we want to preserve exact backwards compatibility with
 * Registration IDs issued by the ENS Subgraph. In the future we may relax exact subgraph backwards
 * compatibility and use `node` for all Registration IDs.
 *
 * @param labelHash the labelHash of the name that was registered
 * @param node the node of the name that was registered
 * @returns a unique registration id
 */
export const makeRegistrationId = (labelHash: LabelHash, node: Node) => {
  if (config.isSubgraphCompatible) return labelHash;
  return node;
};

/**
 * Makes a unique ID for any resolver record entity that is keyed beyond Node
 * (i.e. text, address records).
 *
 * See comment in packages/ensnode-schema/src/subgraph.schema.ts for additional context.
 *
 * @example
 * ```ts
 * // For address records in a Resolver, use coinType as key
 * makeKeyedResolverRecordId(resolverId, coinType.toString())
 * // => "0x123...-60" // for ETH (coinType 60)
 *
 * // For text records in a Resolver, use the text key
 * makeKeyedResolverRecordId(resolverId, "avatar")
 * // => "0x123...-avatar"
 * ```
 *
 * @param resolverId the id of the resolver entity
 * @param key the unique id of the resolver record within a resolverId
 * @returns a unique resolver record entity id
 */
export const makeKeyedResolverRecordId = (resolverId: string, key: string) =>
  [resolverId, key].join("-");
