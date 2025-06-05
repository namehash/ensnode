import type { Address } from "viem";

/**
 * Makes a unique EFP List Storage Location ID.
 *
 * @example `${chainId}-${listRecordsAddress}-${slot}`
 *
 * @param chainId the chain ID
 * @param listRecordsAddress the listRecordsAddress address
 * @param slot the slot value
 * @returns a unique List Storage Location ID
 */
export const makeListStorageLocationId = (
  chainId: number,
  listRecordsAddress: Address,
  slot: bigint,
) => `${chainId}-${listRecordsAddress}-${slot.toString()}`;
