// NOTE: based on code from https://github.com/ethereumfollowprotocol/onchain/blob/598ab49/src/types.ts#L41-L47

import type { Address } from "viem/accounts";

// Documented based on https://docs.efp.app/design/list-storage-location/
export interface ListStorageLocation {
  /**
   * The version of the List Storage Location.
   *
   * This is used to ensure compatibility and facilitate future upgrades.
   * The version is always 1.
   */
  version: ListStorageLocationVersion.V1;

  /**
   * The type of the List Storage Location.
   *
   * This identifies the kind of data the data field contains.
   * The location type is always 1.
   */
  type: ListStorageLocationType.EVMContract;

  /**
   * EVM chain ID of the chain where the EFP list records are stored.
   */
  chainId: number;

  /**
   * EVM address of the contract where the list is stored.
   */
  listRecordsAddress: Address;

  /**
   * The 32-byte value that specifies the storage slot of the list within the contract.
   * This disambiguates multiple lists stored within the same contract and
   * de-couples it from the EFP List NFT token id which is stored on Ethereum and
   * inaccessible on L2s.
   */
  slot: bigint;
}

/**
 * Enum defining List Storage Location Types
 *
 * Based on documentation at:
 * https://docs.efp.app/design/list-storage-location/#location-types
 */
export enum ListStorageLocationType {
  /**
   * EVMContract Data representation:
   * 32-byte chain ID + 20-byte contract address + 32-byte slot
   */
  EVMContract = 1,
}

/**
 * Enum defining List Storage Location Version
 *
 * Based on documentation at:
 * https://docs.efp.app/design/list-storage-location/#serialization
 */
export enum ListStorageLocationVersion {
  V1 = 1,
}
