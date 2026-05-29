import type { NormalizedAddress } from "enssdk";
import type { Hex } from "viem";

/**
 * Synthetic composite primary keys for the EFP tables, mirroring the EFP plugin's
 * `apps/ensindexer/src/plugins/efp/lib/ids.ts`. ENSApi reads ENSDb rows by these ids, so these
 * formats MUST stay in sync with the indexer.
 */

/** `efp_account_metadata` key: `${address}-${key}` (lowercased address). */
export function efpAccountMetadataId(address: NormalizedAddress, key: string): string {
  return `${address}-${key}`;
}

/** `efp_list_storage_locations` key: `${chainId}-${contractAddress}-${slot}` (lowercased hex). */
export function efpStorageLocationId(chainId: number, contractAddress: Hex, slot: Hex): string {
  return `${chainId}-${contractAddress.toLowerCase()}-${slot.toLowerCase()}`;
}
