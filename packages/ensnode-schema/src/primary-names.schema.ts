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

  // account has many avatars
  avatars: many(ext_accountAvatars),
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

export const ext_accountPrimaryNamesRelations = relations(
  ext_accountPrimaryNames,
  ({ one, many }) => ({
    // belongs to account
    account: one(account, {
      fields: [ext_accountPrimaryNames.accountId],
      references: [account.id],
    }),
  }),
);

export const ext_accountAvatars = onchainTable(
  "ext_account_avatars",
  (t) => ({
    // keyed by (accountId, coinType)
    id: t.text().primaryKey(),
    accountId: t.text().notNull(),
    coinType: t.bigint().notNull(),

    avatar: t.text().notNull(),
  }),
  (t) => ({
    byCoinType: uniqueIndex().on(t.accountId, t.coinType),
  }),
);

export const ext_accountAvatarsRelations = relations(
  ext_accountAvatars, //
  ({ one, many }) => ({
    // belongs to account
    account: one(account, {
      fields: [ext_accountAvatars.accountId],
      references: [account.id],
    }),
  }),
);
