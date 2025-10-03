/**
 * Schema Definitions that power Protocol Acceleration in the Resolution API.
 */

import { onchainTable, primaryKey, relations } from "ponder";

/**
 * Tracks an Account's ENSIP-19 Reverse Name Records by CoinType.
 *
 * NOTE: this is NOT a cohesive, materialized index of ALL of an account's Primary Names, it is ONLY
 * an index of its ENSIP-19 Reverse Name _Records_ stored by a StandaloneReverseRegistrar:
 * - default.reverse
 * - [coinType].reverse
 * - NOT *.addr.reverse
 *
 * So these records CANNOT be queried directly and used as a source of truth — you MUST perform
 * Forward Resolution to resolve a consistent set of an Account's ENSIP-19 Primary Names. These records
 * are used to power Protocol Acceleration for those ReverseResolvers backed by a StandloneReverseRegistrar.
 */
export const ext_reverseNameRecord = onchainTable(
  "ext_reverse_name_records",
  (t) => ({
    // keyed by (address, coinType)
    address: t.hex().notNull(),
    coinType: t.bigint().notNull(),

    /**
     * Represents the ENSIP-19 Reverse Name Record for a given (address, coinType).
     *
     * The value of this field is guaranteed to be a non-empty-string normalized ENS name (see
     * `interpretNameRecordValue` for additional context and specific guarantees). Unnormalized
     * names and empty string values are interpreted as a deletion of the associated Reverse Name
     * Record entity (represented in the schema as the _absence_ of a relevant Reverse Name Record
     * entity).
     */
    value: t.text().notNull(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.address, t.coinType] }),
  }),
);

/**
 * Tracks Node-Resolver relationships to accelerate the identification of a node's active resolver.
 *
 * Note that this model supports the indexing of Node-Resolver relationships across multiple chains,
 * in particular to support the acceleration of ForwardResolution#findResolver for the the ENS Root
 * Chain's Registry as well as Basenames' and Lineanames' Shadow Registries. If the chainId in this
 * entity is not the ENS Root Chain, then the entity represents a Node-Resolver relationship within
 * the chainId's respective Shadow Registry.
 *
 * It is keyed by (chainId, node) to match the on-chain datamodel of Registry Node-Resolver relationships.
 */
export const ext_nodeResolverRelation = onchainTable(
  "ext_node_resolver_relations",
  (t) => ({
    // keyed by (chainId, node)
    chainId: t.integer().notNull(),
    node: t.hex().notNull(),

    /**
     * The Address of the Resolver contract this `node` has set (via Registry#NewResolver) within
     * the Registry on `chainId`.
     */
    resolver: t.hex().notNull(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.chainId, t.node] }),
  }),
);

/**
 * Tracks a set of records for a specified `node` within a `resolver` contract on `chainId`.
 *
 * ResolverRecords is keyed by (chainId, resolver, node) and:
 * - has one `name` record (see ENSIP-3)
 * - has many `addressRecords` (unique by coinType) (see ENSIP-9)
 * - has many `textRecords` (unique by key) (see ENSIP-5)
 *
 * It is keyed by (chainId, resolver, node) to match the on-chain datamodel of Resolver contract storage.
 *
 * WARNING: These record values do NOT allow the caller to confidently resolve records for names
 * without following Forward Resolution according to the ENS protocol: a direct query to the database
 * for a record's value is not ENSIP-10 nor CCIP-Read compliant.
 */
export const ext_resolverRecords = onchainTable(
  "ext_resolver_records",
  (t) => ({
    // keyed by (chainId, resolver, node)
    chainId: t.integer().notNull(),
    resolver: t.hex().notNull(),
    node: t.hex().notNull(),

    /**
     * Represents the value of the reverse-resolution (ENSIP-3) name() record, used for Reverse Resolution.
     *
     * The emitted record values are interpreted according to `interpretNameRecordValue` — unnormalized
     * names and empty string values are interpreted as a deletion of the associated record (represented
     * here as `null`).
     *
     * If set, the value of this field is guaranteed to be a non-empty-string normalized ENS name
     * (see `interpretNameRecordValue` for additional context and specific guarantees).
     */
    name: t.text(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.chainId, t.resolver, t.node] }),
  }),
);

export const ext_resolverRecords_relations = relations(ext_resolverRecords, ({ one, many }) => ({
  // resolverRecord has many address records
  addressRecords: many(ext_resolverAddressRecord),

  // resolverRecord has many text records
  textRecords: many(ext_resolverTextRecord),
}));

/**
 * Tracks address records for a `node` by `coinType` within a `resolver` on `chainId`.
 *
 * ResolverAddressRecord is keyed by (chainId, resolver, node, coinType), where the composite key
 * segment (chainId, resolver, node) describes a ResolverRecord entity. A ResolverAddressRecord is
 * then additionally keyed by (coinType).
 */
export const ext_resolverAddressRecord = onchainTable(
  "ext_resolver_address_records",
  (t) => ({
    // keyed by ((chainId, resolver, node), coinType)
    chainId: t.integer().notNull(),
    resolver: t.hex().notNull(),
    node: t.hex().notNull(),
    coinType: t.bigint().notNull(),

    /**
     * Represents the value of the Addresss Record specified by ((chainId, resolver, node), coinType).
     *
     * The value of this field is interpreted by `interpretAddressRecordValue` — see its implementation
     * for additional context and specific guarantees.
     */
    address: t.text().notNull(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.chainId, t.resolver, t.node, t.coinType] }),
  }),
);

export const ext_resolverAddressRecordRelations = relations(
  ext_resolverAddressRecord,
  ({ one, many }) => ({
    // belongs to resolverRecord
    resolver: one(ext_resolverRecords, {
      fields: [
        ext_resolverAddressRecord.chainId,
        ext_resolverAddressRecord.resolver,
        ext_resolverAddressRecord.node,
      ],
      references: [
        ext_resolverRecords.chainId,
        ext_resolverRecords.resolver,
        ext_resolverRecords.node,
      ],
    }),
  }),
);

/**
 * Tracks text records for a `node` by `key` within a `resolver` on `chainId`.
 *
 * ResolverTextRecord is keyed by (chainId, resolver, node, key), where the composite key
 * segment (chainId, resolver, node) describes a ResolverRecord entity. A ResolverTextRecord is
 * then additionally keyed by (key).
 */
export const ext_resolverTextRecord = onchainTable(
  "ext_resolver_text_records",
  (t) => ({
    // keyed by ((chainId, resolver, node), key)
    chainId: t.integer().notNull(),
    resolver: t.hex().notNull(),
    node: t.hex().notNull(),
    key: t.text().notNull(),

    /**
     * Represents the value of the Text Record specified by ((chainId, resolver, node), key).
     *
     * The value of this field is interpreted by `interpretTextRecordValue` — see its implementation
     * for additional context and specific guarantees.
     */
    value: t.text().notNull(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.chainId, t.resolver, t.node, t.key] }),
  }),
);

export const ext_resolverTextRecordRelations = relations(
  ext_resolverTextRecord,
  ({ one, many }) => ({
    // belongs to resolverRecord
    resolver: one(ext_resolverRecords, {
      fields: [
        ext_resolverTextRecord.chainId,
        ext_resolverTextRecord.resolver,
        ext_resolverTextRecord.node,
      ],
      references: [
        ext_resolverRecords.chainId,
        ext_resolverRecords.resolver,
        ext_resolverRecords.node,
      ],
    }),
  }),
);

/**
 * Tracks the migration status of a node.
 *
 * Due to a security issue, ENS migrated from the RegistryOld contract to a new Registry
 * contract. When indexing events, the indexer must ignore any events on the RegistryOld for domains
 * that have since been migrated to the new Registry.
 *
 * To store the necessary information required to implement this behavior, we track the set of nodes
 * that have been registered in the (new) Registry contract on the ENS Root Chain. When an event is
 * encountered on the RegistryOld contract, if the relevant node exists in this set, the event should
 * be ignored, as the node is considered migrated.
 *
 * Note that this logic is only necessary for the ENS Root Chain, the only chain that includes the
 * Registry migration: we do not track nodes in the the Basenames and Lineanames deployments of the
 * Registry on their respective chains, for example.
 *
 * Note also that this Registry migration tracking is isolated to the Protocol Acceleration schema/plugin.
 * That is, the subgraph core plugin implements its own Registry migration logic, and the future
 * ensv2 core plugin will likely do the same. By isolating this logic to the Protocol Acceleration
 * plugin, we allow the Protocol acceleration plugin to be run independently of a core plugin
 * (and could be run _without_ a core plugin, for example).
 */
export const ext_migratedNode = onchainTable("ext_migrated_nodes", (t) => ({
  node: t.hex().primaryKey(),
}));
