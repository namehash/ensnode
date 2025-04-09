import type { EventIdPrefix, PluginName } from "@/lib/types";
import type { LabelHash, Node } from "@ensnode/utils";
import type { Address } from "viem";

// NOTE: subgraph uses lowercase address here, viem provides us checksummed, so we lowercase it
export const makeResolverId = (address: Address, node: Node) =>
  [address.toLowerCase(), node].join("-");

/**
 * Makes a cross-registrar unique event ID.
 *
 * The ENS Subgraph indexes events from a single network and constructs event ids like:
 * `${blockNumber}-${logIndex}(-${transferIndex})`. Because ENSIndexer indexes multiple networks,
 * however, event ids can collide between chains, if the blockNumber and logIndex happen to line up.
 * This function allows for an optional prefix, keeping Subgraph-compatible event IDs
 * (produces `blocknumber-logIndex` or `blocknumber-logindex-transferindex`) if undefined and
 * ensuring event id uniqueness across plugins if set.
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
 * The ENS Subgraph, as originally designed, uses a Domain's labelHash as its Registration entity's ID.
 * Because ENSIndexer supports multiple plugins using the shared handlers (modelled after the
 * Subgraph's indexing logic) that may create additional Registration entities, ID collisions must
 * be avoided.
 *
 * To do so, if the caller identifies as the root plugin, we use the Domain's `labelHash` as
 * originally specified. Otherwise, for any other plugin, we use the Domain's `node`, which is
 * certain to avoid collisions.
 *
 * We intentionally mix `labelHash` and `node` (namehash) values as registration ids: both are
 * keccak256 hashes, so we take advantage of the odds of a collision being practically zero.
 *
 * For the "v1" of ENSIndexer (at a minimum) we want to preserve exact backwards compatibility with
 * Registration IDs issued by the ENS Subgraph. In the future we may abandon exact subgraph
 * compatibility and use `node` for all Registration IDs.
 *
 * @param pluginName the name of the active plugin issuing the registration
 * @param labelHash the labelHash of the name that was registered
 * @param node the node of the name that was registered
 * @returns a unique registration id
 */
export const makeRegistrationId = (pluginName: PluginName, labelHash: LabelHash, node: Node) => {
  if (pluginName === "eth") {
    return labelHash;
  } else {
    return node;
  }
};
