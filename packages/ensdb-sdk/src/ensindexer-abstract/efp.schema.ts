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
 */

import type { ChainId, DurationBigInt, NormalizedAddress, TokenId } from "enssdk";
import { index, onchainTable } from "ponder";

/**
 * One row per minted `ListRegistry` NFT (a "list"). EFP separates the NFT `owner`, the
 * `user` allowed to post records, and the `manager` allowed to administer the list. The
 * `listStorageLocation*` columns describe which `(chainId, contractAddress, slot)` tuple in
 * `efp_list_records` stores this list's records.
 */
export const efpLists = onchainTable(
  "efp_lists",
  (t) => ({
    /** ERC-721 token id of the list NFT (a uint256), the list's primary key. */
    id: t.bigint().primaryKey().$type<TokenId>(),
    /** Current ERC-721 owner of the list NFT. */
    owner: t.hex().notNull().$type<NormalizedAddress>(),
    /** Chain id of the `ListRegistry` NFT (Base / 8453 on mainnet; the active namespace's EFP deployment chain otherwise). */
    nftChainId: t.int8({ mode: "number" }).notNull().$type<ChainId>(),
    /** `ListRegistry` contract address on `nftChainId`. */
    nftContractAddress: t.hex().notNull().$type<NormalizedAddress>(),
    /** Raw `UpdateListStorageLocation` payload. */
    listStorageLocation: t.hex(),
    /** Decoded list storage location: target chain id. */
    listStorageLocationChainId: t.int8({ mode: "number" }).$type<ChainId>(),
    /** Decoded list storage location: target contract address. */
    listStorageLocationContractAddress: t.hex().$type<NormalizedAddress>(),
    /** Decoded list storage location: target slot (bytes32). */
    listStorageLocationSlot: t.hex(),
    /** Address allowed to post records to this list (the EFP "user"). */
    user: t.hex().$type<NormalizedAddress>(),
    /** Address allowed to administer this list (the EFP "manager"). */
    manager: t.hex().$type<NormalizedAddress>(),
    createdAt: t.bigint().notNull().$type<DurationBigInt>(),
    updatedAt: t.bigint().notNull().$type<DurationBigInt>(),
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
    // `id` is a `bigint` (Postgres `numeric`) primary key, so its implicit unique index already
    // orders numerically — `efp.lists` / `Account.efp.lists` pagination needs no extra index.
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
    contractAddress: t.hex().notNull().$type<NormalizedAddress>(),
    slot: t.hex().notNull(),
    /**
     * Token id of the list NFT that owns this storage location's reverse mapping. The slot is
     * arbitrary, attacker-settable bytes, so multiple list NFTs can point at the same
     * `(chainId, contract, slot)`; this records the FIRST list to claim it (first writer wins), and
     * the `UpdateListStorageLocation` handler gates every write/delete of this row on that ownership.
     * A consequence: when lists share a slot, only the owner's `EfpListRecord.list` back-ref and
     * `user`/`manager` role routing track that slot.
     */
    tokenId: t.bigint().notNull().$type<TokenId>(),
    updatedAt: t.bigint().notNull().$type<DurationBigInt>(),
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
    contractAddress: t.hex().notNull().$type<NormalizedAddress>(),
    slot: t.hex().notNull(),
    /** Canonical record prefix `version | type | address` (22 bytes). */
    record: t.hex().notNull(),
    /** Decoded record header — version byte. */
    recordVersion: t.integer().notNull(),
    /** Decoded record header — type byte. */
    recordType: t.integer().notNull(),
    /** Decoded record data. Only address records (type 1) are indexed, so exactly a 20-byte address. */
    recordData: t.hex().notNull().$type<NormalizedAddress>(),
    /** UTF-8 tags attached to this record (a set; NULL bytes stripped). */
    tags: t.text().array().notNull().default([]),
    createdAt: t.bigint().notNull().$type<DurationBigInt>(),
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
    contractAddress: t.hex().notNull().$type<NormalizedAddress>(),
    /** Account whose metadata this is. */
    address: t.hex().notNull().$type<NormalizedAddress>(),
    /** Metadata key (UTF-8 string). */
    key: t.text().notNull(),
    /** Metadata value (raw bytes). */
    value: t.hex().notNull(),
    /**
     * For the `primary-list` key only: the decoded token id of the account's primary list (the
     * `value` is `abi.encodePacked(uint256)`, which Postgres can't compare to the numeric
     * `efp_lists.id`). Decoding it at index time makes the validated follower/following social graph
     * a pure SQL join. `null` for any other key, or a malformed `primary-list` value.
     */
    primaryListTokenId: t.bigint().$type<TokenId>(),
    createdAt: t.bigint().notNull().$type<DurationBigInt>(),
    updatedAt: t.bigint().notNull().$type<DurationBigInt>(),
  }),
  (t) => ({
    idx_address: index().on(t.address),
    // Account-metadata lookups (primary-list validation, `metadata(key:)`) filter by `(address, key)`;
    // a composite index makes that a point lookup rather than an address-partition scan.
    idx_address_key: index().on(t.address, t.key),
    // The followers join filters lists by `(user, primaryListTokenId)`; index it for the social graph.
    idx_primaryListTokenId: index().on(t.primaryListTokenId),
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
    contractAddress: t.hex().notNull().$type<NormalizedAddress>(),
    slot: t.hex().notNull(),
    key: t.text().notNull(),
    value: t.hex().notNull(),
    createdAt: t.bigint().notNull().$type<DurationBigInt>(),
  }),
  (t) => ({
    idx_slot: index().on(t.chainId, t.contractAddress, t.slot),
  }),
);
