/**
 * Schema Definitions for optional tracking of additional Resolver record values
 *
 * Some background context: In the ENSv1 protocol, any number of Resolver contracts may exist on mainnet,
 * each of which can manage any number of records for any number of Nodes. That is, there is a
 * many-to-many relationship between Resolver contracts and Nodes: a Resolver manages records for
 * any number of Nodes and Nodes may have records managed by many Resolver contracts.
 *
 * During resolution, ENSIP-10 is followed to identify a single 'active' Resolver contract for a Node,
 * and it is only that Resolver that is queried in order to resolve the 'active' records for the given Node.
 *
 * A Resolver _contract_ in ENS represents the following:
 * Resolver Contract
 *   - has many records for many Nodes
 *     - has one `addr` record for a Node (see ENSIP-1)
 *     - has one `name` record for a Node (see ENSIP-3)
 *     - has one `abi` record for a Node (see ENSIP-4)
 *     - has one `contenthash` record for a Node (see ENSIP-7)
 *     - has one `pubkey` record for a Node (see PubkeyResolver.sol)
 *     - has one `version` record for a Node (see IVersionableResolver.sol)
 *     - has many address records for a Node (by coinType) (see ENSIP-9)
 *     - has many text records for a Node (by key) (see ENSIP-5)
 *     - has many interface records for a Node (by interfaceID) (see ENSIP-8)
 *     - ...etc
 *
 * In the Subgraph schema, however, a Resolver _entity_ in the database does NOT represent a
 * Resolver _contract_: it represents the pairwise relationship between a Resolver contract and a
 * Node and is unique by ([chainId], Resolver contract address, Node). That is, it represents
 * "a Node's relationship to an on-chain Resolver contract".
 *
 * Naturally, this discrepancy may be confusing, but throughout this codebase a Resolver _entity_
 * refers to that _relationship_ between a Resolver and Node, _not_ the unique Resolver contract itself.
 *
 * The Subgraph describes the following datamodel instead:
 * Resolver (the Resolver-Node relationship)
 *   - has one `addr` record for a Node
 *   - has one `contenthash` record for a Node
 *   - has one set of `coinTypes` storing the keys of all ENSIP-9 address records emitted for a Node
 *     - NOTE(subgraph-compat): does _not_ track the implicit coinType of 60 for the `addr` record, if set
 *   - has one set of `texts` storing the keys of all ENSIP-5 text records emitted for a Node
 *
 * In this file, we extend the subgraph's Resolver _entity_ with the following _additional_ records:
 * Resolver (the Resolver-Node relationship)
 *   + has one `name` record for a Node (see ENSIP-3)
 *     - see 'NOTE(resolver-records)' in subgraph.schema.ts
 *   + has many `addressRecords` for a Node (by coinType) (see ENSIP-9)
 *     - see ResolverAddressRecord below
 *     - NOTE: _does_ represent the implcit coinType of 60 for the `addr` record, if set
 *   + has many `textRecords` for a Node (by key) (see ENSIP-5)
 *     - see ResolverTextRecord below
 *
 * NOTE: These additional record values still do NOT allow the caller to confidently resolve records
 * for names without following Forward Resolution according to the ENS protocol: a direct query for
 * the indexed values of a names's Resolver and retrieval of its values is not ENSIP-10 nor
 * CCIP-Read compliant.
 */

import { onchainTable, relations, uniqueIndex } from "ponder";
import { resolver } from "./subgraph.schema";

// add the additional relationships to subgraph's Resolver entity
export const ext_resolverRelations = relations(resolver, ({ one, many }) => ({
  // resolver has many address records
  addressRecords: many(ext_resolverAddressRecords),

  // resolver has many text records
  // NOTE: can't use `texts` because Resolver.texts is used by subgraph schema
  textRecords: many(ext_resolverTextRecords),
}));

export const ext_resolverAddressRecords = onchainTable(
  "ext_resolver_address_records",
  (t) => ({
    // keyed by (resolverId, coinType)
    id: t.text().primaryKey(),
    resolverId: t.text().notNull(),
    coinType: t.bigint().notNull(),

    address: t.text().notNull(),
  }),
  (t) => ({
    byCoinType: uniqueIndex().on(t.id, t.coinType),
  }),
);

export const ext_resolverAddressRecordsRelations = relations(
  ext_resolverAddressRecords,
  ({ one, many }) => ({
    // belongs to resolver
    resolver: one(resolver, {
      fields: [ext_resolverAddressRecords.resolverId],
      references: [resolver.id],
    }),
  }),
);

export const ext_resolverTextRecords = onchainTable(
  "ext_resolver_text_records",
  (t) => ({
    // keyed by (resolverId, key)
    id: t.text().primaryKey(),
    resolverId: t.text().notNull(),
    key: t.text().notNull(),

    value: t.text().notNull(),
  }),
  (t) => ({
    byKey: uniqueIndex().on(t.resolverId, t.key),
  }),
);

export const ext_resolverTextRecordsRelations = relations(
  ext_resolverTextRecords,
  ({ one, many }) => ({
    // belongs to resolver
    resolver: one(resolver, {
      fields: [ext_resolverTextRecords.resolverId],
      references: [resolver.id],
    }),
  }),
);
