import type { Labelhash, Node } from "ensnode-utils/types";
import type { Address, Hex } from "viem";

// NOTE: subgraph uses lowercase address here, viem provides us checksummed, so we lowercase it
export const makeResolverId = (address: Address, node: Hex) =>
  [address.toLowerCase(), node].join("-");

export const makeEventId = (
  registrarName: string,
  blockNumber: bigint,
  logIndex: number,
  transferIndex?: number,
) => {
  const parts = [blockNumber.toString(), logIndex.toString(), transferIndex?.toString()];

  const joinParts = (parts: Array<string | undefined>) => parts.filter(Boolean).join("-");

  return makeId(
    registrarName,
    // https://github.com/ensdomains/ens-subgraph/blob/master/src/utils.ts#L5
    // produces `blocknumber-logIndex` or `blocknumber-logindex-transferindex`
    () => joinParts(parts),
    // for example registrar name, `linea.eth` produces
    // `linea.eth-blocknumber-logIndex` or `linea.eth-blocknumber-logindex-transferindex`
    () => joinParts([registrarName, ...parts]),
  );
};

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
export const makeRegistrationId = (registrarName: string, labelHash: Labelhash, node: Node) => {
  return makeId(
    registrarName,
    // For the "v1" of ENSNode (at a minimum) we want to preserve backwards
    // compatibility with Registration id's issued by the ENS Subgraph.
    // In the future we'll explore more fundamental solutions to avoiding
    // Registration id collissions. For now are consciously mixing `labelHash`
    // and `node` (namehash) values as registration ids. Both are keccak256
    // hashes, so we take advantage of the odds of a collision being
    // practically zero.
    () => labelHash,
    // Avoid collisions between Registrations for the same direct subname from
    // different Registrars.
    () => node,
  );
};

/**
 * ENS Subgraph assumes that all transactions happen on a single chain.
 * However, ENSNode supports multiple chains. This multi-chain support requires
 * unique ID value.
 *
 * This function allows keeping backwards compatibility with the ENS Subgraph by
 * using the `subgraphCompatibleValue` factory, and also allows for unique IDs
 * across chains by using the `crossChainUniqueValue` factory.
 *
 * @param registrarName the name of the registrar issuing the registration
 * @param subgraphCompatibleValue the factory creating a subgraph compatible value
 * @param crossChainUniqueValue the factory creating a cross chain unique value
 * @returns unique id
 */
export const makeId = <Id>(
  registrarName: string,
  subgraphCompatibleValue: () => Id,
  crossChainUniqueValue: () => Id,
): Id => {
  if (registrarName === "eth") {
    return subgraphCompatibleValue();
  }

  return crossChainUniqueValue();
};
