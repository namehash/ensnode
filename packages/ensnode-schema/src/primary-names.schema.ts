/**
 * Implements Schema Definitions for optional indexing of an account's Primary Names across multiple
 * chains as specified by ENSIP-19.
 */

import { onchainTable, relations, uniqueIndex } from "ponder";
import { account } from "./subgraph.schema";

// add the additional relationships to subgraph's Account entity
export const ext_accountRelations = relations(account, ({ one, many }) => ({
  // account has many primary names
  primaryNames: many(ext_accountPrimaryNames),
}));

export const ext_accountPrimaryNames = onchainTable(
  "ext_account_primary_names",
  (t) => ({
    // keyed by (accountId, coinType)
    id: t.text().primaryKey(),
    accountId: t.text().notNull(),
    coinType: t.bigint().notNull(),

    name: t.text().notNull(),
  }),
  (t) => ({
    byCoinType: uniqueIndex().on(t.accountId, t.coinType),
  }),
);
