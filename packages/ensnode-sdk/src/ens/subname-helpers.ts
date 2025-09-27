import { Hex, concat, keccak256, toHex } from "viem";

import type { LabelHash, Node } from "./types";

/**
 * Implements one step of the namehash algorithm, combining `labelHash` with `node` to produce
 * the `node` of a given subdomain. Note that the order of the arguments is 'reversed' (as compared to
 * the actual concatenation) in order to improve readability (i.e. read as [labelHash].[node]).
 */
export const makeSubdomainNode = (labelHash: LabelHash, node: Node): Node =>
  keccak256(concat([node, labelHash]));

/**
 * Encodes a uint256 bigint as hex string sized to 32 bytes.
 * Uses include, in the context of ENS, decoding the uint256-encoded tokenId of NFT-issuing contracts
 * into Node or LabelHash, which is a common behavior in the ENS ecosystem.
 * (see NameWrapper, ETHRegistrarController)
 */
export const uint256ToHex32 = (num: bigint): Hex => toHex(num, { size: 32 });
