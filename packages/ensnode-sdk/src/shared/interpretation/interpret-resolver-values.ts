import type { Hex } from "enssdk";
import { size, zeroHash } from "viem";

/**
 * Interprets an ENSIP-7 contenthash value. Empty bytes are interpreted as deletion.
 */
export function interpretContenthashValue(value: Hex): Hex | null {
  if (size(value) === 0) return null;
  return value;
}

/**
 * Interprets a PubkeyResolver (x, y) pair. A (zeroHash, zeroHash) pair is interpreted as deletion.
 *
 * Invariant: both null together, or both set together.
 */
export function interpretPubkeyValue(x: Hex, y: Hex): { x: Hex; y: Hex } | null {
  if (x === zeroHash && y === zeroHash) return null;
  return { x, y };
}

/**
 * Interprets an IDNSZoneResolver zonehash value. Empty bytes are interpreted as deletion.
 */
export function interpretDnszonehashValue(value: Hex): Hex | null {
  if (size(value) === 0) return null;
  return value;
}
