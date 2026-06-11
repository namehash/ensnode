/**
 * EFP (Ethereum Follow Protocol) abstract schema.
 *
 * Tables are prefixed `efp_` and indexed by the EFP plugin
 * (`apps/ensindexer/src/plugins/efp`). The model mirrors the ethereumfollowprotocol/api-v2
 * reference indexer with two adaptations for ENSNode's primary-key-only access pattern:
 * `efp_list_storage_locations` is a reverse index so list-metadata events resolve the owning list
 * NFT by primary key (rather than scanning `efp_lists` by storage location), and a record's tags
 * are embedded as an array on `efp_list_records` (rather than a separate join table) so removing a
 * record is a single primary-key delete instead of a non-PK cascade.
 *
 * Timestamps are Unix-seconds `bigint`s (the block timestamp), matching ENSNode convention.
 */

import type { Address, ChainId } from "enssdk";
import { index, onchainTable, sql } from "ponder";

/**
 * One row per minted `ListRegistry` NFT (a "list"). EFP separates the NFT `owner`, the
 * `user` allowed to post records, and the `manager` allowed to administer the list. The
 * `listStorageLocation*` columns describe which `(chainId, contractAddress, slot)` tuple in
 * `efp_list_records` stores this list's records.
 */
export const efpLists = onchainTable(
  "efp_lists",
  (t) => ({
    /** ERC-721 token id of the list NFT, as a decimal string. */
    tokenId: t.text().primaryKey(),
    /** Current ERC-721 owner of the list NFT. */
    owner: t.hex().notNull().$type<Address>(),
    /** Chain id of the `ListRegistry` NFT (Base / 8453 on mainnet; the active namespace's EFP deployment chain otherwise). */
    nftChainId: t.int8({ mode: "number" }).notNull().$type<ChainId>(),
    /** `ListRegistry` contract address on `nftChainId`. */
    nftContractAddress: t.hex().notNull().$type<Address>(),
    /** Raw `UpdateListStorageLocation` payload. */
    listStorageLocation: t.hex(),
    /** Decoded list storage location: target chain id. */
    listStorageLocationChainId: t.int8({ mode: "number" }).$type<ChainId>(),
    /** Decoded list storage location: target contract address. */
    listStorageLocationContractAddress: t.hex().$type<Address>(),
    /** Decoded list storage location: target slot (bytes32). */
    listStorageLocationSlot: t.hex(),
    /** Address allowed to post records to this list (the EFP "user"). */
    user: t.hex().$type<Address>(),
    /** Address allowed to administer this list (the EFP "manager"). */
    manager: t.hex().$type<Address>(),
    createdAt: t.bigint().notNull(),
    updatedAt: t.bigint().notNull(),
  }),
  (t) => ({
    idx_owner: index().on(t.owner),
    idx_user: index().on(t.user),
    idx_manager: index().on(t.manager),
    idx_storageLocation: index().on(
      t.listStorageLocationChainId,
      t.listStorageLocationContractAddress,
      t.listStorageLocationSlot,
    ),
    // Numeric (not lexicographic) ordering of the text `tokenId` (a uint256, too large for an
    // integer column) is index-backed via this expression index, so `efp.lists` /
    // `Account.efp.lists` pagination — which compares and orders by `tokenId::numeric` — stays
    // index-backed at mainnet-scale list counts instead of falling back to a sort.
    idx_tokenId_numeric: index("efp_lists_token_id_numeric").on(sql`(${t.tokenId}::numeric)`),
  }),
);

/**
 * Reverse index from a storage location `(chainId, contractAddress, slot)` to the list NFT that
 * points at it. Written by the `UpdateListStorageLocation` handler so that `UpdateListMetadata`
 * events (emitted by the `ListRecords` contract, keyed only by slot) can find the owning list NFT
 * by primary key instead of scanning `efp_lists`.
 */
export const efpListStorageLocations = onchainTable(
  "efp_list_storage_locations",
  (t) => ({
    /** Composite key "chainId-contractAddress-slot". */
    id: t.text().primaryKey(),
    chainId: t.int8({ mode: "number" }).notNull().$type<ChainId>(),
    contractAddress: t.hex().notNull().$type<Address>(),
    slot: t.hex().notNull(),
    /**
     * Token id of the list NFT that owns this storage location's reverse mapping. The slot is
     * arbitrary, attacker-settable bytes, so multiple list NFTs can point at the same
     * `(chainId, contract, slot)`; this records the FIRST list to claim it (first writer wins), and
     * the `UpdateListStorageLocation` handler gates every write/delete of this row on that ownership.
     * A consequence: when lists share a slot, only the owner's `EfpListRecord.list` back-ref and
     * `user`/`manager` role routing track that slot.
     */
    tokenId: t.text().notNull(),
    updatedAt: t.bigint().notNull(),
  }),
  (t) => ({
    idx_tokenId: index().on(t.tokenId),
  }),
);

/**
 * One row per record currently in a list. The `record` column is the canonical
 * `version | type | address` 22-byte prefix (any trailing junk after the address truncated), which
 * is also what tag and remove ops reference. A record's `tags` are embedded here as a set of UTF-8
 * strings, so removing a record drops its tags in the same primary-key delete.
 */
export const efpListRecords = onchainTable(
  "efp_list_records",
  (t) => ({
    /** Composite key "chainId-contractAddress-slot-record". */
    id: t.text().primaryKey(),
    chainId: t.int8({ mode: "number" }).notNull().$type<ChainId>(),
    contractAddress: t.hex().notNull().$type<Address>(),
    slot: t.hex().notNull(),
    /** Canonical record prefix `version | type | address` (22 bytes). */
    record: t.hex().notNull(),
    /** Decoded record header — version byte. */
    recordVersion: t.integer().notNull(),
    /** Decoded record header — type byte. */
    recordType: t.integer().notNull(),
    /** Decoded record data. Only address records (type 1) are indexed, so exactly a 20-byte address. */
    recordData: t.hex().notNull().$type<Address>(),
    /** UTF-8 tags attached to this record (a set; NUL bytes stripped). */
    tags: t.text().array().notNull().default([]),
    createdAt: t.bigint().notNull(),
  }),
  (t) => ({
    idx_slot: index().on(t.chainId, t.contractAddress, t.slot),
    idx_recordData: index().on(t.recordData),
  }),
);

/**
 * Most-recent `value` per `(address, key)` account-metadata pair (today only `primary-list`).
 */
export const efpAccountMetadata = onchainTable(
  "efp_account_metadata",
  (t) => ({
    /** Composite key "chainId-address-key". */
    id: t.text().primaryKey(),
    chainId: t.int8({ mode: "number" }).notNull().$type<ChainId>(),
    contractAddress: t.hex().notNull().$type<Address>(),
    /** Account whose metadata this is. */
    address: t.hex().notNull().$type<Address>(),
    /** Metadata key (UTF-8 string). */
    key: t.text().notNull(),
    /** Metadata value (raw bytes). */
    value: t.hex().notNull(),
    createdAt: t.bigint().notNull(),
    updatedAt: t.bigint().notNull(),
  }),
  (t) => ({
    idx_address: index().on(t.address),
  }),
);

/**
 * EFP List Metadata (`user` / `manager`), keyed by the storage location it is set at
 * (`chainId-contractAddress-slot-key`), not by list NFT. `UpdateListMetadata` is emitted on the
 * `ListRecords` contract while the storage-location mapping is created by `UpdateListStorageLocation`
 * on the `ListRegistry` contract (a different contract, sometimes on a different chain), so the two
 * can arrive in either order. The value here is durable: it survives a list re-pointing its storage
 * location, and the storage-location handler reads it to (re-)populate `efp_lists.user` / `manager`
 * for whichever list points at the location. One row per `(location, key)`, bounded by the number
 * of distinct locations seen.
 */
export const efpListMetadata = onchainTable(
  "efp_list_metadata",
  (t) => ({
    /** Composite key "chainId-contractAddress-slot-key". */
    id: t.text().primaryKey(),
    chainId: t.int8({ mode: "number" }).notNull().$type<ChainId>(),
    contractAddress: t.hex().notNull().$type<Address>(),
    slot: t.hex().notNull(),
    key: t.text().notNull(),
    value: t.hex().notNull(),
    createdAt: t.bigint().notNull(),
  }),
  (t) => ({
    idx_slot: index().on(t.chainId, t.contractAddress, t.slot),
  }),
);
