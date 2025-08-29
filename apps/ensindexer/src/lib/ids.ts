import config from "@/config";
import {
  type CoinType,
  type LabelHash,
  type Node,
  coinTypeReverseLabel,
} from "@ensnode/ensnode-sdk";
import { type Address, getAddress } from "viem";

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
    // NOTE(subgraph-compat): subgraph uses lowercase address here, otherwise keep checksummed
    address.toLowerCase(),
    // config.isSubgraphCompatible ? address.toLowerCase() : address,
    node,
  ]
    .filter(Boolean)
    .join("-");

/**
 * Parses a resolver ID string back into its components.
 * Handles both subgraph-compatible and chain-scoped formats.
 * Checksums the address.
 *
 * @param resolverId The resolver ID string to parse
 * @returns object describing each segment of the resolver ID
 */
export const parseResolverId = (
  resolverId: string,
): { chainId: number | null; address: Address; node: Node } => {
  const parts = resolverId.split("-");

  if (parts.length === 2) {
    return {
      chainId: null,
      address: getAddress(parts[0] as Address),
      node: parts[1] as Node,
    };
  }

  if (parts.length === 3) {
    return {
      chainId: parseInt(parts[0]!),
      address: getAddress(parts[1] as Address),
      node: parts[2] as Node,
    };
  }

  throw new Error(`Invalid resolver ID format: ${resolverId}`);
};

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
 * (currently modelled after the Subgraph's indexing logic), however,
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

/**
 * Makes a unique ID for a domain-resolver relation on a given chain. DomainResolverRelations are
 * unique by (chainId, domainId).
 *
 * @see packages/ensnode-schema/src/resolver-relations.schema.ts
 *
 * @example `${chainId}-${domainId}`
 *
 * @param chainId the chain ID
 * @param domainId the domain ID (node)
 * @returns a unique domain-resolver relation ID
 */
export const makeDomainResolverRelationId = (chainId: number, domainId: Node) =>
  [chainId, domainId].join("-");

/**
 * Makes a unique ID for a primary name record, keyed by (address, coinType).
 *
 * @param address the address for which the primary name is set
 * @param coinType the coin type
 * @returns a unique primary name id
 */
export const makePrimaryNameId = (address: Address, coinType: CoinType) =>
  [address, coinTypeReverseLabel(coinType)].join("-");
