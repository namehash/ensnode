/**
 * Schema Definitions for optional tracking of Resolver records.
 *
 * Some background context: In the ENS protocol, there exist many Resolver contracts, on many chains,
 * each of which can track many records for any number of Nodes. Only one Resolver contract for a
 * given Name is 'active' at any one time, and it is _that_ Resolver contract that one must query to
 * resolve records for the Node in question.
 *
 * In the Subgraph schema, however a Resolver _entity_ does NOT represent a Resolver _contract_:
 * it represents the pairwise relationship between a Resolver contract and a Node and is unique by
 * ([chainId], Resolver contract address, Node). That is, it represents "a Node's relationship to
 * an on-chain Resolver contract".
 *
 * Naturally, this discrepancy may be confusing, but throughout this codebase a Resolver _entity_
 * refers to that _relationship_ between a Resolver and Node, _not_ the unique Resolver contract itself.
 *
 * A Resolver _contract_ in ENS represents the following:
 *
 * Resolver
 * - has many ResolverRecords (i.e. 'records for a given Node')
 *   - name
 *   - abi
 *   - contenthash
 *   - pubkey
 *   - version
 *   - has many address records by coinType
 *   - has many text records by key
 *   - has many interface records by interfaceID
 *   - ...etc
 *
 * In this file, we extend the subgraph's Resolver _entity_, which does not track the values of
 * its records (except for `addr` and `contentHash`), only the keys of text records (in `texts`)
 * and the keys of `address` records (in `coinTypes`).
 *
 * This file specifies the following datamodel:
 *
 * Resolver <- subgraph schema entity, actually (Resolver contract, Node)
 * - name <- added, implicitly keyed by Node
 * - abi, contenthash, pubkey, version, ...etc if desired
 * - has many ResolverAddressRecords by `coinType`
 *   - coinType
 *   - address
 * - has many ResolverTextRecords by `key`
 *   - key
 *   - value
 *
 * This results in the following query patterns (ponder graphql pseudo code) to look up the records
 * for a Node within a Resolver contract:
 *
 * NOTE: generate the (subgraph entity) Resolver ID as:
 * - (if running in subgraph-compat mode): `${resolverContractAddress.toLowerCase()}-${node}`
 * - (if not running in subgraph-compat mode): `${chainId}-${resolverContractAddress.toLowerCase()}-${node}`
 *
 * @example
 * ```gql
 * query RecordsForNode($id: ID!) {
 *   resolver(id: $id) {
 *     name
 *     addressRecords { totalCount items { coinType address } }
 *     textRecords { totalCount items { key value } }
 *   }
 * }
 *```
 */

import { index, onchainTable, relations } from "ponder";
import { resolver } from "./subgraph.schema";

// add the additional `Resolver.records` relationship to subgraph's Resolver entity
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
