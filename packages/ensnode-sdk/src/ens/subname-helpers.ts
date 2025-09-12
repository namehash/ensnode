import { Address, Hex, concat, isAddress, isHash, keccak256, size, toHex } from "viem";

import { labelhashLiteralLabel } from "../shared";
import { addrReverseLabel } from "./reverse-name";
import type { LabelHash, LiteralLabel, Node } from "./types";

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
export const maybeHealLabelByReverseAddress = (
  labelHash: LabelHash,
  address: Address,
): LiteralLabel | null => {
  if (!isHash(labelHash) || size(labelHash) !== 32) throw new Error("Invalid labelHash");
  if (!isAddress(address)) throw new Error("Invalid address");

  // construct a Reverse Name's label from the provided address
  const maybeLabel = addrReverseLabel(address);

  // if its labelhash matches what we're looking for, then that was the label!
  if (labelhashLiteralLabel(maybeLabel) === labelHash) return maybeLabel;

  // otherwise, healing did not succeed
  return null;
};

/**
 * Encodes a uint256 bigint as hex string sized to 32 bytes.
 * Uses include, in the context of ENS, decoding the uint256-encoded tokenId of NFT-issuing contracts
 * into Node or LabelHash, which is a common behavior in the ENS ecosystem.
 * (see NameWrapper, ETHRegistrarController)
 */
export const uint256ToHex32 = (num: bigint): Hex => toHex(num, { size: 32 });
