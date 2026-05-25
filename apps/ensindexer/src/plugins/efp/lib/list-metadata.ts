import type { Hex } from "viem";

/**
 * Interpret an EFP list-metadata `value` payload as an address: the well-known `user` and
 * `manager` metadata keys carry a 20-byte address in the leading bytes of the value.
 */
export function metadataValueToAddress(value: Hex): Hex {
  return `0x${value.slice(2, 42).toLowerCase()}` as Hex;
}
