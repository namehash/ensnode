/**
 * Schema Definitions that power Protocol Acceleration in the Resolution API.
 */

import { onchainTable, primaryKey, relations } from "ponder";

/**
 * Tracks an Account's ENSIP-19 Primary Name by CoinType.
 *
 * NOTE: this is NOT a cohesive, materialized index of ALL of an account's names, it is ONLY the
 * materialized index of its ENSIP-19 Primary Names backed by a StandaloneReverseRegistrar:
 * - default.reverse
 * - [coinType].reverse
 * - NOT *.addr.reverse
 *
 * So these records CANNOT be queried directly and used as a source of truth — you MUST perform
 * Forward Resolution to resolve a consistent set of an Account's ENSIP-19 Primary Names. These records
 * are used to power Protocol Acceleration for those ReverseResolvers backed by a StandloneReverseRegistrar.
 */
export const ext_primaryName = onchainTable(
  "ext_primary_names",
  (t) => ({
    // keyed by (address, coinType)
    address: t.hex().notNull(),
    coinType: t.bigint().notNull(),

    /**
     * Represents the ENSIP-19 Primary Name value for a given (address, coinType).
     *
     * The value of this field is guaranteed to be a non-empty-string normalized ENS name. Unnormalized
     * names and empty string values are interpreted as a deletion of the associated Primary Name
     * entity (represented as the absence of a relevant Primary Name entity) — see `interpretNameRecordValue`
     * for additional context.
     */
    name: t.text().notNull(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.address, t.coinType] }),
  }),
);

/**
 * Tracks Node<->Resolver relationships by chainId to additionally support the chain-specific
 * Node<->Resolver relationships within the Basenames and Lineanames Shadow Registries.
 *
 * Necessary to accelerate Basenames/Lineanames CCIP-Reads.
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
    resolverAddress: t.hex().notNull(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.chainId, t.node] }),
  }),
);

/**
 * Tracks a set of records for a specified `node` within a Resolver contract.
 *
 * ResolverRecords is keyed by (chainId, address, node) and:
 * - has one `name` record (see ENSIP-3)
 * - has many `addressRecords` (unique by coinType) (see ENSIP-9)
 * - has many `textRecords` (unique by key) (see ENSIP-5)
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
     * Represents the value of the reverse-resolution (ENSIP-3) name() record.
     *
     * The emitted record values are interpreted according to `interpretNameRecordValue` — unnormalized
     * names and empty string values are interpreted as a deletion of the associated record (represented
     * here as `null`).
     *
     * If set, the value of this field is guaranteed to be a non-empty-string normalized ENS name
     * (see `interpretNameRecordValue` for guarantees).
     */
    name: t.text(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.chainId, t.resolver, t.node] }),
  }),
);

// add the additional `Resolver.records` relationship to subgraph's Resolver entity
export const ext_resolverRecords_relations = relations(ext_resolverRecords, ({ one, many }) => ({
  // resolverRecords has many address records
  addressRecords: many(ext_resolverAddressRecords),

  // resolverRecords has many text records
  textRecords: many(ext_resolverTextRecords),
}));

export const ext_resolverAddressRecords = onchainTable(
  "ext_resolver_address_records",
  (t) => ({
    // keyed by (chainId, resolver, node, coinType)
    chainId: t.integer().notNull(),
    resolver: t.hex().notNull(),
    node: t.hex().notNull(),
    coinType: t.bigint().notNull(),

    /**
     * Represents the value of the Addresss Record specified by (resolverRecordsId, coinType).
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

export const ext_resolverAddressRecordsRelations = relations(
  ext_resolverAddressRecords,
  ({ one, many }) => ({
    // belongs to resolverRecords
    resolver: one(ext_resolverRecords, {
      fields: [
        ext_resolverAddressRecords.chainId,
        ext_resolverAddressRecords.resolver,
        ext_resolverAddressRecords.node,
      ],
      references: [
        ext_resolverRecords.chainId,
        ext_resolverRecords.resolver,
        ext_resolverRecords.node,
      ],
    }),
  }),
);

export const ext_resolverTextRecords = onchainTable(
  "ext_resolver_text_records",
  (t) => ({
    // keyed by (chainId, resolver, node, key)
    chainId: t.integer().notNull(),
    resolver: t.hex().notNull(),
    node: t.hex().notNull(),
    key: t.text().notNull(),

    /**
     * Represents the value of the Text Record specified by (resolverRecordsId, key).
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

export const ext_resolverTextRecordsRelations = relations(
  ext_resolverTextRecords,
  ({ one, many }) => ({
    // belongs to resolverRecords
    resolver: one(ext_resolverRecords, {
      fields: [
        ext_resolverTextRecords.chainId,
        ext_resolverTextRecords.resolver,
        ext_resolverTextRecords.node,
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
export const ext_migratedNodes = onchainTable("ext_migrated_nodes", (t) => ({
  node: t.hex().primaryKey(),
}));
