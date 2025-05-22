/**
 * Implements Schema Definitions for optional tracking of Resolver records. Note that in the
 * subgraph schema, a Resolver does not represent a Resolver contract, it represents the pairwise
 * relationship between a Resolver contract and a Node, i.e. it represents (Resolver, Node).
 *
 * A more accurate datamodel might be to model Resolver as a contract and a ResolverRecords entity
 * to represent the pairwise relationship between a Resolver and a Node for which it holds records.
 * This should be considered in a novel schema for ENSv2.
 */

import { index, onchainTable, relations } from "ponder";
import { resolver } from "./subgraph.schema";

// add the additional `Resolver.records` relationship to subgraph's Resolver entity
export const ext_resolverRelations = relations(resolver, ({ one, many }) => ({
  // resolver has many address records
  addresses: many(ext_resolverAddressRecords),
  // resolver has many text records
  texts: many(ext_resolverTextRecords),
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
    byCoinType: index().on(t.id, t.coinType),
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
    byKey: index().on(t.id, t.key),
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
