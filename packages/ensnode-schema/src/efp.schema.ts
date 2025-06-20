/**
 * Schema definitions for EFP entities.
 */

import { onchainTable, relations } from "ponder";

/**
 * EFP List Token
 *
 * Represents an onchain ERC-721A NFT representing an EFP list minted with the EFPListRegistry contract.
 */
export const efp_listToken = onchainTable("efp_list_token", (p) => ({
  /**
   * EFP List Token ID
   *
   * The ID of the ERC-721A NFT representing an EFP list minted with the EFPListRegistry contract.
   * It's a very important value as it enables
   * `getListStorageLocation(tokenId)` call on the EFPListRegistry contract,
   * which result allows querying data for related list records.
   */
  id: p.bigint().primaryKey(),

  /**
   * Owner address
   *
   * The address of the current owner of the EFP List Token.
   */
  ownerAddress: p.hex().notNull(),
}));

/**
 * EFP List Storage Location
 *
 * @link https://docs.efp.app/design/list-storage-location/#onchain-storage
 */
export const efp_listStorageLocation = onchainTable("efp_list_storage_location", (p) => ({
  /**
   * ListStorageLocation ID
   *
   * This compound identifier is a value of `ListStorageLocationId` type.
   *
   * NOTE:
   * We use a compound identifier for database performance benefits.
   */
  id: p.text().primaryKey(),

  /**
   * EVM chain ID of the chain where the EFP list records are stored.
   *
   * This value is of `EFPDeploymentChainId` type.
   */
  chainId: p.integer().notNull(),

  /**
   * Contract address on chainId where the EFP list records are stored.
   */
  listRecordsAddress: p.hex().notNull(),

  /**
   * Slot
   *
   * 32-byte value that specifies the storage slot of the EFP list records within the listRecordsAddress contract.
   * This disambiguates multiple lists stored within the same contract and
   * de-couples it from the EFP List NFT token id which is stored on the EFP deployment root chain and
   * inaccessible on other chains.
   */
  slot: p.bigint().notNull(),

  /**
   * EFP List Token ID
   *
   * Foreign key to the associated EFP List Token.
   */
  listTokenId: p.bigint().notNull(),
}));

// Define relationship between the "List Token" and the "List Storage Location" entities
// Each List Token has zero-to-one List Storage Location.
// If zero it means the associated List Storage Location was never created or incorrectly formatted.
export const efp_listTokenRelations = relations(efp_listToken, ({ one }) => ({
  listStorageLocation: one(efp_listStorageLocation, {
    fields: [efp_listToken.id],
    references: [efp_listStorageLocation.listTokenId],
  }),
}));

// Define relationship between the "List Storage Location" and the "List Token" entities
// Each List Storage Location is associated with exactly one List Token.
export const efp_listStorageLocationRelations = relations(efp_listStorageLocation, ({ one }) => ({
  listToken: one(efp_listToken, {
    fields: [efp_listStorageLocation.listTokenId],
    references: [efp_listToken.id],
  }),
}));
