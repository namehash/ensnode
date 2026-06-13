import type { ChainId, Hex, NormalizedAddress } from "../lib/types";

/**
 * Deterministic composite primary keys for the EFP (Ethereum Follow Protocol) tables, shared by the
 * ENSIndexer EFP plugin (the writer) and ENSApi (the reader) so both derive identical ids.
 * Components are joined with `-`; `NormalizedAddress` and `Hex` values are already lowercase, so keys
 * built from different event sources (e.g. an LSL payload vs. a `ListOp` slot) collide correctly.
 */

/** `efp_list_storage_locations` key: a storage location `(chainId, contractAddress, slot)`. */
export function storageLocationId(
  chainId: ChainId,
  contractAddress: NormalizedAddress,
  slot: Hex,
): string {
  return [chainId, contractAddress, slot].join("-");
}

/** `efp_list_records` key: a record within a list. */
export function listRecordId(
  chainId: ChainId,
  contractAddress: NormalizedAddress,
  slot: Hex,
  record: Hex,
): string {
  return [chainId, contractAddress, slot, record].join("-");
}

/**
 * `efp_account_metadata` key: a `(chainId, address, key)` tuple. `key` must already be a valid
 * metadata key — callers reject NUL-byte keys upstream (see `interpretMetadataKey`), so this helper
 * does not strip them (stripping would silently collapse distinct on-chain keys onto one id).
 */
export function accountMetadataId(
  chainId: ChainId,
  address: NormalizedAddress,
  key: string,
): string {
  return [chainId, address, key].join("-");
}

/** `efp_list_metadata` key: per-location metadata `(storage location, key)`. */
export function listMetadataId(
  chainId: ChainId,
  contractAddress: NormalizedAddress,
  slot: Hex,
  key: string,
): string {
  return [chainId, contractAddress, slot, key].join("-");
}
