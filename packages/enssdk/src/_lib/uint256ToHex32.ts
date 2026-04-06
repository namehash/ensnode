import { type Hex, toHex } from "viem";

/**
 * Converts a uint256 bigint to a zero-padded 32-byte (64-character) lowercase hex string.
 */
export const uint256ToHex32 = (num: bigint): Hex => toHex(num, { size: 32 });
