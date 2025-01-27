import type { Address, Hex } from "viem";
import type { Labelhash, Node, OwnedName } from "./types";

// NOTE: subgraph uses lowercase address here, viem provides us checksummed, so we lowercase it
export const makeResolverId = (address: Address, node: Hex) =>
  [address.toLowerCase(), node].join("-");

// https://github.com/ensdomains/ens-subgraph/blob/master/src/utils.ts#L5
// produces `blocknumber-logIndex` or `blocknumber-logindex-transferindex`
export const makeEventId = (blockNumber: bigint, logIndex: number, transferIndex?: number) =>
  [blockNumber.toString(), logIndex.toString(), transferIndex?.toString()]
    .filter(Boolean)
    .join("-");

/**
 * Makes a cross-chain unique registration ID.
 *
 * A Registration record's id is historically the labelhash of the label
 * directly under the name the Registrar manages (i.e. for a registration
 * of test.eth, a Registration's id is labelhash('test')). Because the original
 * subgraph implementation didn't consider indexing any Registrars besides
 * the .eth Registrar, this leaves no room in the namespace for Registration
 * records from other Registrars (like the base.eth and linea.eth Registrars).
 * To account for this, while preserving backwards compatibility, Registration
 * records created for the .eth Registrar use label as id and those created by
 * any other Registrar use node (i.e. namehash(test.base.eth) to avoid
 * collisions that would otherwise occur.
 *
 * @param ownedName the ownedName of the ENSNode plugin that is processing the registration event
 * @param label registration's label
 * @param node registration's node
 */
export const makeRegistrationId = (ownedName: OwnedName, label: Labelhash, node: Node) =>
  ownedName === "eth" ? label : node;
