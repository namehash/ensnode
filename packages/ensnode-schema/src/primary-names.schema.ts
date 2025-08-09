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

// tracks an Account's Primary Name by CoinType
export const ext_primaryName = onchainTable(
  "ext_primary_names",
  (t) => ({
    // keyed by (address, coinType)
    id: t.text().primaryKey(),
    address: t.hex().notNull(),
    coinType: t.bigint().notNull(),

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
