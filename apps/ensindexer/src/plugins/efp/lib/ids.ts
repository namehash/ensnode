import type { Hex } from "viem";

/**
 * Deterministic composite primary keys for the EFP tables. Hex components are lowercased so keys
 * built from different event sources (e.g. an LSL payload vs. a `ListOp` slot) collide correctly.
 */

/** `efp_list_storage_locations` key: a storage location `(chainId, contractAddress, slot)`. */
export function storageLocationId(chainId: number, contractAddress: Hex, slot: Hex): string {
  return `${chainId}-${contractAddress.toLowerCase()}-${slot.toLowerCase()}`;
}

/** `efp_list_records` key: a record within a list. */
export function listRecordId(
  chainId: number,
  contractAddress: Hex,
  slot: Hex,
  record: Hex,
): string {
  return `${chainId}-${contractAddress.toLowerCase()}-${slot.toLowerCase()}-${record.toLowerCase()}`;
}

/** `efp_account_metadata` key: an `(address, key)` pair (lowercased address; NUL bytes stripped from the key). */
export function accountMetadataId(address: Hex, key: string): string {
  return `${address.toLowerCase()}-${key.replace(/\0/g, "")}`;
}

/** `efp_list_metadata` key: per-location metadata `(storage location, key)`. */
export function listMetadataId(
  chainId: number,
  contractAddress: Hex,
  slot: Hex,
  key: string,
): string {
  return `${chainId}-${contractAddress.toLowerCase()}-${slot.toLowerCase()}-${key}`;
}
