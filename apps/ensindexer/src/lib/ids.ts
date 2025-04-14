import { EventIdPrefix } from "@/lib/types";
import { type LabelHash, type Node, PluginName } from "@ensnode/utils";
import type { Address } from "viem";

// NOTE: subgraph uses lowercase address here, viem provides us checksummed, so we lowercase it
export const makeResolverId = (address: Address, node: Node) =>
  [address.toLowerCase(), node].join("-");

/**
 * Makes a unique event ID, optionally prefixed to avoid collisions.
 * See {@link EventIdPrefix} for additional discussion on collisions.
 *
 * @example With no prefix (subgraph-compat): `${blockNumber}-${logIndex}(-${transferIndex})`
 * @example With prefix (plugin-scoped): `${prefix}-${blockNumber}-${logIndex}(-${transferIndex})`
 *
 * @param prefix optional prefix
 * @param blockNumber
 * @param logIndex
 * @param transferIndex
 * @returns
 */
export const makeEventId = (
  prefix: EventIdPrefix,
  blockNumber: bigint,
  logIndex: number,
  transferIndex?: number,
) =>
  [prefix, blockNumber.toString(), logIndex.toString(), transferIndex?.toString()]
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
 * To avoid collisions, if the caller identifies as the root plugin, we use the Domain's `labelHash`
 * (subgraph compat). Otherwise, for any other plugin, we use the Domain's `node`, which is
 * globally unique within ENS.
 *
 * We knowingly mix `labelHash` (labelhash) and `node` (namehash) values as registration ids:
 * both result in keccak256 hashes (the odds of a collision being practically zero) and are derived
 * differently — the result of `namehash` will never (practically zero) collide with the result of
 * `labelhash` because `namehash` always includes the recursive hashing of the root node.
 *
 * For the "v1" of ENSIndexer (at a minimum) we want to preserve exact backwards compatibility with
 * Registration IDs issued by the ENS Subgraph. In the future we may abandon exact subgraph backwards
 * compatibility and use `node` for all Registration IDs.
 *
 * @param pluginName the name of the active plugin issuing the registration
 * @param labelHash the labelHash of the name that was registered
 * @param node the node of the name that was registered
 * @returns a unique registration id
 */
export const makeRegistrationId = (pluginName: PluginName, labelHash: LabelHash, node: Node) => {
  if (pluginName === PluginName.Root) return labelHash;
  return node;
};
