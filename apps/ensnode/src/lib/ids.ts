import type { Labelhash, Node } from "@ensnode/utils/types";
import type { Address, Hex } from "viem";

// NOTE: subgraph uses lowercase address here, viem provides us checksummed, so we lowercase it
export const makeResolverId = (address: Address, node: Hex) =>
  [address.toLowerCase(), node].join("-");

/**
 * Makes a cross-registrar unique event ID.
 *
 * The ENS Subgraph indexes events from a single registrar. However, ENSNode
 * enables indexing of events from multiple registrars, which can lead to event
 * ID collisions. This function allows keeping Subgraph-compatible event IDs
 * (produces `blocknumber-logIndex` or `blocknumber-logindex-transferindex`)
 * while ensuring event id uniqueness across registrars.
 *
 * @param registrarName the name of the registrar associated with the event
 * @param blockNumber
 * @param logIndex
 * @param transferIndex
 * @returns
 */
export const makeEventId = (
  registrarName: string,
  blockNumber: bigint,
  logIndex: number,
  transferIndex?: number
) =>
  [
    registrarName === "eth" ? undefined : registrarName,
    blockNumber.toString(),
    logIndex.toString(),
    transferIndex?.toString(),
  ]
    .filter(Boolean)
    .join("-");

/**
 * Makes a cross-registrar unique registration ID.
 *
 * The ENS Subgraph has the potential to index "selected data" for any ENS name
 * (ex: through the Registry or the NameWrapper). However, the "selected data"
 * indexed by the ENS Subgraph varies depending on attributes of the name. For
 * example, the ENS Subgraph only indexes Registration records for direct
 * subnames of ".eth". This allows the ENS Subgraph to assign distinct
 * Registration ids using only the labelhash of the direct subname being
 * registered. (i.e. for the registration of "test.eth", the Registration's id
 * is `labelhash('test'))`.
 *
 * ENSNode (with multiple plugins activated) indexes Registration records from
 * multiple Registrars (like the base.eth and linea.eth Registrars). Therefore,
 * we use this function to avoid Registration id collisions that would otherwise
 * occur. (i.e. this function provides unique registration ids for "test.eth",
 * "test.base.eth", and "test.linea.eth", etc.
 *
 * @param registrarName the name of the registrar issuing the registration
 * @param labelHash the labelHash of the subname that was registered directly
 *                  beneath `registrarName`
 * @param node the node of the full name that was registered
 * @returns a unique registration id
 */
export const makeRegistrationId = (
  registrarName: string,
  labelHash: Labelhash,
  node: Node
) => {
  if (registrarName === "eth") {
    // For the "v1" of ENSNode (at a minimum) we want to preserve backwards
    // compatibility with Registration id's issued by the ENS Subgraph.
    // In the future we'll explore more fundamental solutions to avoiding
    // Registration id collissions. For now are consciously mixing `labelHash`
    // and `node` (namehash) values as registration ids. Both are keccak256
    // hashes, so we take advantage of the odds of a collision being
    // practically zero.
    return labelHash;
  } else {
    // Avoid collisions between Registrations for the same direct subname from
    // different Registrars.
    return node;
  }
};
