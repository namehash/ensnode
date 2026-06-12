import { type NormalizedAddress, toNormalizedAddress } from "enssdk";
import type { Hex } from "viem";

/**
 * Interpret an EFP list-metadata `value` as a role address. The well-known `user` / `manager` keys
 * carry exactly a 20-byte address; the generic metadata setter can emit arbitrary bytes, so any
 * other length is malformed and returns `null` to clear the role rather than store a truncated or
 * empty address (which would later surface through a GraphQL `Address`).
 */
export function metadataValueToAddress(value: Hex): NormalizedAddress | null {
  try {
    return toNormalizedAddress(value);
  } catch {
    return null;
  }
}
