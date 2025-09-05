import { Address, Hex, concat, isAddress, isHash, keccak256, toHex } from "viem";

import { labelhash } from "viem/ens";
import { addrReverseLabel } from "./reverse-name";
import type { LabelHash, Node } from "./types";

/**
 * Implements one step of the namehash algorithm, combining `labelHash` with `node` to produce
 * the `node` of a given subdomain. Note that the order of the arguments is 'reversed' (as compared to
 * the actual concatenation) in order to improve readability (i.e. read as [labelHash].[node]).
 */
export const makeSubdomainNode = (labelHash: LabelHash, node: Node): Node =>
  keccak256(concat([node, labelHash]));

/**
 * Attempt to heal the labelHash of an addr.reverse subname using an address that might be related to the subname.
 *
 * @throws if maybeReverseAddress is not a valid Address
 * @throws if labelHash is not a valid Labelhash
 *
 * @returns the original label if healed, otherwise null
 */
export const maybeHealLabelByReverseAddress = ({
  maybeReverseAddress,
  labelHash,
}: {
  /** The address that is possibly associated with the addr.reverse subname */
  maybeReverseAddress: Address;

  /** The labelhash of the addr.reverse subname */
  labelHash: LabelHash;
}): string | null => {
  // check if required arguments are valid
  if (!isAddress(maybeReverseAddress)) {
    throw new Error(
      `Invalid reverse address: '${maybeReverseAddress}'. Must be a valid EVM Address.`,
    );
  }

  if (!isHash(labelHash)) {
    throw new Error(
      `Invalid labelHash: '${labelHash}'. Must start with '0x' and represent 32 bytes.`,
    );
  }

  // derive the assumed label from the normalized address
  const assumedLabel = addrReverseLabel(maybeReverseAddress);

  // if labelHash of the assumed label matches the provided labelHash, heal
  if (labelhash(assumedLabel) === labelHash) return assumedLabel;

  // otherwise, healing did not succeed
  // TODO: log the event args for analysis and debugging
  return null;
};

/**
 * Encodes a uint256 bigint as hex string sized to 32 bytes.
 * Uses include, in the context of ENS, decoding the uint256-encoded tokenId of NFT-issuing contracts
 * into Node or LabelHash, which is a common behavior in the ENS ecosystem.
 * (see NameWrapper, ETHRegistrarController)
 */
export const uint256ToHex32 = (num: bigint): Hex => toHex(num, { size: 32 });
