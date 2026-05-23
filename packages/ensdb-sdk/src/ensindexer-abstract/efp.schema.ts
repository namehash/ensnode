/**
 * EFP (Ethereum Follow Protocol) abstract schema.
 *
 * Tables are prefixed `efp_` and indexed by the EFP plugin
 * (`apps/ensindexer/src/plugins/efp`). The first five tables mirror the
 * ethereumfollowprotocol/api-v2 reference indexer's data model; `efp_list_storage_locations`
 * is added so list-metadata events can resolve the owning list NFT by primary key
 * (rather than scanning `efp_lists` by storage location).
 *
 * Timestamps are Unix-seconds `bigint`s (the block timestamp), matching ENSNode convention.
 */

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
    /** ERC-721 token id of the list NFT, as a decimal string. */
    tokenId: t.text().primaryKey(),
    /** Current ERC-721 owner of the list NFT. */
    owner: t.hex().notNull(),
    /** Chain id of the `ListRegistry` NFT (always Base / 8453). */
    nftChainId: t.int8({ mode: "number" }).notNull(),
    /** `ListRegistry` contract address on `nftChainId`. */
    nftContractAddress: t.hex().notNull(),
    /** Raw `UpdateListStorageLocation` payload. */
    listStorageLocation: t.hex(),
    /** Decoded list storage location: target chain id. */
    listStorageLocationChainId: t.int8({ mode: "number" }),
    /** Decoded list storage location: target contract address. */
    listStorageLocationContractAddress: t.hex(),
    /** Decoded list storage location: target slot (bytes32). */
    listStorageLocationSlot: t.hex(),
    /** Address allowed to post records to this list (the EFP "user"). */
    user: t.hex(),
    /** Address allowed to administer this list (the EFP "manager"). */
    manager: t.hex(),
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
    chainId: t.int8({ mode: "number" }).notNull(),
    contractAddress: t.hex().notNull(),
    slot: t.hex().notNull(),
    /** Token id of the list NFT currently pointing at this storage location. */
    tokenId: t.text().notNull(),
    updatedAt: t.bigint().notNull(),
  }),
  (t) => ({
    idx_tokenId: index().on(t.tokenId),
  }),
);

/**
 * One row per record currently in a list. The `record` column is the full record payload
 * (`version | type | data`), so two records that decode to the same address but with different
 * headers remain distinct.
 */
export const efpListRecords = onchainTable(
  "efp_list_records",
  (t) => ({
    /** Composite key "chainId-contractAddress-slot-record". */
    id: t.text().primaryKey(),
    chainId: t.int8({ mode: "number" }).notNull(),
    contractAddress: t.hex().notNull(),
    slot: t.hex().notNull(),
    /** Full record payload (`version | type | data`). */
    record: t.hex().notNull(),
    /** Decoded record header — version byte. */
    recordVersion: t.integer().notNull(),
    /** Decoded record header — type byte. */
    recordType: t.integer().notNull(),
    /** Decoded record data. For address records (type 1), exactly 20 bytes. */
    recordData: t.hex().notNull(),
    createdAt: t.bigint().notNull(),
  }),
  (t) => ({
    idx_slot: index().on(t.chainId, t.contractAddress, t.slot),
    idx_recordData: index().on(t.recordData),
  }),
);

/**
 * Many-to-many between records and UTF-8 tags.
 */
export const efpListRecordTags = onchainTable(
  "efp_list_record_tags",
  (t) => ({
    /** Composite key "chainId-contractAddress-slot-record-tag". */
    id: t.text().primaryKey(),
    chainId: t.int8({ mode: "number" }).notNull(),
    contractAddress: t.hex().notNull(),
    slot: t.hex().notNull(),
    /** Record prefix `version | type | address` (22 bytes). */
    record: t.hex().notNull(),
    /** UTF-8 tag (NUL bytes stripped). */
    tag: t.text().notNull(),
    createdAt: t.bigint().notNull(),
  }),
  (t) => ({
    idx_slot: index().on(t.chainId, t.contractAddress, t.slot),
    idx_record: index().on(t.record),
    idx_tag: index().on(t.tag),
  }),
);

/**
 * Most-recent `value` per `(address, key)` account-metadata pair (today only `primary-list`).
 */
export const efpAccountMetadata = onchainTable(
  "efp_account_metadata",
  (t) => ({
    /** Composite key "address-key". */
    id: t.text().primaryKey(),
    chainId: t.int8({ mode: "number" }).notNull(),
    contractAddress: t.hex().notNull(),
    /** Account whose metadata this is. */
    address: t.hex().notNull(),
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
 * Staging area for `UpdateListMetadata` (`user`/`manager`) events that arrive before the matching
 * list row's storage location is known. `UpdateListMetadata` is emitted on the `ListRecords`
 * contract, while the storage-location mapping is created by `UpdateListStorageLocation` on the
 * `ListRegistry` contract — a different contract, sometimes on a different chain. The
 * storage-location handler drains matching rows when it runs.
 */
export const efpPendingListMetadata = onchainTable(
  "efp_pending_list_metadata",
  (t) => ({
    /** Composite key "chainId-contractAddress-slot-key". */
    id: t.text().primaryKey(),
    chainId: t.int8({ mode: "number" }).notNull(),
    contractAddress: t.hex().notNull(),
    slot: t.hex().notNull(),
    key: t.text().notNull(),
    value: t.hex().notNull(),
    createdAt: t.bigint().notNull(),
  }),
  (t) => ({
    idx_slot: index().on(t.chainId, t.contractAddress, t.slot),
  }),
);

/**
 * Cross-correlation between an ENS namehash and a specific EFP list NFT, populated from
 * `Resolver.TextChanged` events whose key is `eth.efp.list`. The same node can have pointers via
 * multiple resolvers, so they are not collapsed at write time. An empty / unparseable text record
 * deletes the row, matching the ENS convention that an empty text record is unset.
 */
export const efpEnsListPointers = onchainTable(
  "efp_ens_list_pointers",
  (t) => ({
    /** Composite key "chainId-resolver-node-ensKey". */
    id: t.text().primaryKey(),
    /** Chain id of the resolver contract that emitted the TextChanged event. */
    chainId: t.int8({ mode: "number" }).notNull(),
    /** Resolver contract address. */
    resolver: t.hex().notNull(),
    /** ENS namehash of the name whose text record this is. */
    node: t.hex().notNull(),
    /** The ENS text-record key matched on (e.g. "eth.efp.list"). */
    ensKey: t.text().notNull(),
    /** Raw text-record value, kept verbatim for re-parsing. */
    rawValue: t.text().notNull(),
    /** Decoded list token id (decimal string). */
    listTokenId: t.text().notNull(),
    /** Decoded list contract address (defaults to the EFP ListRegistry on Base). */
    listContract: t.hex().notNull(),
    /** Decoded list chain id (defaults to 8453 / Base for plain decimal values). */
    listChainId: t.int8({ mode: "number" }).notNull(),
    createdAt: t.bigint().notNull(),
    updatedAt: t.bigint().notNull(),
  }),
  (t) => ({
    idx_node: index().on(t.node),
    idx_listTokenId: index().on(t.listTokenId),
  }),
);
