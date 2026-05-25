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

/** `efp_list_record_tags` key: a `(record, tag)` pair within a list. */
export function listRecordTagId(
  chainId: number,
  contractAddress: Hex,
  slot: Hex,
  record: Hex,
  tag: string,
): string {
  return `${chainId}-${contractAddress.toLowerCase()}-${slot.toLowerCase()}-${record.toLowerCase()}-${tag}`;
}

/** `efp_account_metadata` key: an `(address, key)` pair. */
export function accountMetadataId(address: Hex, key: string): string {
  return `${address.toLowerCase()}-${key}`;
}

/** `efp_pending_list_metadata` key: a staged metadata `(storage location, key)`. */
export function pendingListMetadataId(
  chainId: number,
  contractAddress: Hex,
  slot: Hex,
  key: string,
): string {
  return `${chainId}-${contractAddress.toLowerCase()}-${slot.toLowerCase()}-${key}`;
}

/** `efp_ens_list_pointers` key: a `(resolver, node, ensKey)` on a chain. */
export function ensListPointerId(
  chainId: number,
  resolver: Hex,
  node: Hex,
  ensKey: string,
): string {
  return `${chainId}-${resolver.toLowerCase()}-${node.toLowerCase()}-${ensKey}`;
}
