/**
 * Schema Definitions that power Protocol Acceleration in the Resolution API.
 */

import { onchainTable, primaryKey, relations, uniqueIndex } from "ponder";
import type { Address } from "viem";

import type { ChainId, DomainId, Node, ResolverId, ResolverRecordsId } from "@ensnode/ensnode-sdk";

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
export const reverseNameRecord = onchainTable(
  "reverse_name_records",
  (t) => ({
    // keyed by (address, coinType)
    address: t.hex().notNull().$type<Address>(),
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
 * Tracks Domain-Resolver Relationships. This powers:
 *  1. Domain-Resolver Realtionships within the GraphQL API, and
 *  2. Accelerated lookups of a Domain's Resolver within the Resolution API.
 *
 * It is keyed by (chainId, address, domainId) to match the on-chain datamodel of
 * Registry/(shadow)Registry Domain-Resolver relationships.
 */
export const domainResolverRelation = onchainTable(
  "domain_resolver_relations",
  (t) => ({
    // keyed by (chainId, registry, node)
    chainId: t.integer().notNull().$type<ChainId>(),

    // The Registry (ENSv1Registry or ENSv2Registry)'s AccountId.
    address: t.hex().notNull().$type<Address>(),
    domainId: t.hex().notNull().$type<DomainId>(),

    // The Domain's assigned Resolver's address (NOTE: always scoped to chainId)
    resolver: t.hex().notNull().$type<Address>(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.chainId, t.address, t.domainId] }),
  }),
);

export const domainResolverRelation_relations = relations(domainResolverRelation, ({ one }) => ({
  resolver: one(resolver, {
    fields: [domainResolverRelation.chainId, domainResolverRelation.resolver],
    references: [resolver.chainId, resolver.address],
  }),
}));

/**
 * Resolver represents an individual IResolver contract that has emitted at least 1 event.
 * Note that Resolver contracts can exist on-chain but not emit any events and still function
 * properly, so checks against a Resolver's existence and metadata must be done at runtime.
 *
 * We index whether a Resolver is an IExtendedResolver or an IDedicatedResolver, to minimize RPC
 * requests at the API layer, when resolving resources, but note that runtime operations like
 * Forward Resolution _must_ query a Resolver's existence against the chain, because the indexed set
 * of Resolvers is a subset of the theoretical set of functional Resolvers deployed to a given chain.
 */
export const resolver = onchainTable(
  "resolvers",
  (t) => ({
    // keyed by (chainId, address)
    id: t.text().primaryKey().$type<ResolverId>(),

    chainId: t.integer().notNull().$type<ChainId>(),
    address: t.hex().notNull().$type<Address>(),

    /**
     * Whether the Resolver implements IExtendedResolver.
     */
    isExtended: t.boolean().notNull().default(false),

    /**
     * Whether the Resolver implements IDedicatedResolver.
     */
    isDedicated: t.boolean().notNull().default(false),
  }),
  (t) => ({
    byId: uniqueIndex().on(t.chainId, t.address),
  }),
);

export const resolver_relations = relations(resolver, ({ many }) => ({
  records: many(resolverRecords),
}));

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
export const resolverRecords = onchainTable(
  "resolver_records",
  (t) => ({
    // keyed by (chainId, resolver, node)
    id: t.text().primaryKey().$type<ResolverRecordsId>(),

    chainId: t.integer().notNull().$type<ChainId>(),
    address: t.hex().notNull().$type<Address>(),
    node: t.hex().notNull().$type<Node>(),

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
    byId: uniqueIndex().on(t.chainId, t.address, t.node),
  }),
);

export const resolverRecords_relations = relations(resolverRecords, ({ one, many }) => ({
  // belongs to resolver
  resolver: one(resolver, {
    fields: [resolverRecords.chainId, resolverRecords.address],
    references: [resolver.chainId, resolver.address],
  }),

  // resolverRecord has many address records
  addressRecords: many(resolverAddressRecord),

  // resolverRecord has many text records
  textRecords: many(resolverTextRecord),
}));

/**
 * Tracks address records for a `node` by `coinType` within a `resolver` on `chainId`.
 *
 * ResolverAddressRecord is keyed by (chainId, resolver, node, coinType), where the composite key
 * segment (chainId, resolver, node) describes a ResolverRecord entity. A ResolverAddressRecord is
 * then additionally keyed by (coinType).
 */
export const resolverAddressRecord = onchainTable(
  "resolver_address_records",
  (t) => ({
    // keyed by ((chainId, resolver, node), coinType)
    chainId: t.integer().notNull().$type<ChainId>(),
    address: t.hex().notNull().$type<Address>(),
    node: t.hex().notNull().$type<Node>(),
    // NOTE: all well-known CoinTypes fit into javascript number but NOT postgres .integer, must be
    // stored as BigInt
    coinType: t.bigint().notNull(),

    /**
     * Represents the value of the Addresss Record specified by ((chainId, resolver, node), coinType).
     *
     * The value of this field is interpreted by `interpretAddressRecordValue` — see its implementation
     * for additional context and specific guarantees.
     */
    value: t.text().notNull(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.chainId, t.address, t.node, t.coinType] }),
  }),
);

export const resolverAddressRecordRelations = relations(resolverAddressRecord, ({ one }) => ({
  // belongs to resolverRecord
  resolver: one(resolverRecords, {
    fields: [
      resolverAddressRecord.chainId,
      resolverAddressRecord.address,
      resolverAddressRecord.node,
    ],
    references: [resolverRecords.chainId, resolverRecords.address, resolverRecords.node],
  }),
}));

/**
 * Tracks text records for a `node` by `key` within a `resolver` on `chainId`.
 *
 * ResolverTextRecord is keyed by (chainId, resolver, node, key), where the composite key
 * segment (chainId, resolver, node) describes a ResolverRecord entity. A ResolverTextRecord is
 * then additionally keyed by (key).
 */
export const resolverTextRecord = onchainTable(
  "resolver_text_records",
  (t) => ({
    // keyed by ((chainId, resolver, node), key)
    chainId: t.integer().notNull().$type<ChainId>(),
    address: t.hex().notNull().$type<Address>(),
    node: t.hex().notNull().$type<Node>(),
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
    pk: primaryKey({ columns: [t.chainId, t.address, t.node, t.key] }),
  }),
);

export const resolverTextRecordRelations = relations(resolverTextRecord, ({ one }) => ({
  // belongs to resolverRecord
  resolver: one(resolverRecords, {
    fields: [resolverTextRecord.chainId, resolverTextRecord.address, resolverTextRecord.node],
    references: [resolverRecords.chainId, resolverRecords.address, resolverRecords.node],
  }),
}));

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
export const migratedNode = onchainTable("migrated_nodes", (t) => ({
  node: t.hex().primaryKey(),
}));
