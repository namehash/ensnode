/**
 * Schema Definitions for tracking an Account's ENSIP-19 Primary Name(s) by CoinType.
 */

import { onchainTable, relations, uniqueIndex } from "ponder";
import { account } from "./subgraph.schema";

// add the additional relationships to subgraph's Account entity
export const ext_primaryNames_domain_relations = relations(account, ({ one, many }) => ({
  // account has many primary names
  primaryNames: many(ext_primaryName),
}));

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
    id: t.text().primaryKey(),
    address: t.hex().notNull(),
    coinType: t.bigint().notNull(),

    /**
     * Represents the ENSIP-19 Primary Name value for a given (address, coinType).
     *
     * The value of this field is guaranteed to be a non-empty-string normalized ENS name.
     */
    name: t.text().notNull(),
  }),
  (t) => ({
    byAddressAndCoinType: uniqueIndex().on(t.address, t.coinType),
  }),
);

export const ext_primaryNameRelations = relations(ext_primaryName, ({ one, many }) => ({
  // belongs to account
  account: one(account, {
    fields: [ext_primaryName.address],
    references: [account.id],
  }),
}));
