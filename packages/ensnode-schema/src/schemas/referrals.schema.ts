/**
 * Schema Definitions for tracking of ENS referrals.
 */

import { index, onchainTable, relations } from "ponder";

/**
 * A RegistrationReferral tracks individual occurences of referrals for ENS name registrations.
 */
export const registrationReferral = onchainTable(
  "registration_referral",
  (t) => ({
    // keyed by any arbitrary unique id, usually `event.id`
    id: t.text().primaryKey(),

    referrer: t.hex().notNull(),
    node: t.hex().notNull(),
    referee: t.hex().notNull(),
    baseCost: t.bigint().notNull(),
    premium: t.bigint().notNull(),
    total: t.bigint().notNull(),

    // chainId the transaction occurred on
    chainId: t.integer().notNull(),
    // transaction's hash
    transactionHash: t.hex().notNull(),
    // block's Unix timestamp in seconds
    timestamp: t.bigint().notNull(),
  }),
  (t) => ({
    byReferee: index().on(t.referee),
    byReferrer: index().on(t.referrer),
  }),
);

export const registrationReferral_relations = relations(registrationReferral, ({ one, many }) => ({
  // RegistrationReferral belongs to Referrer
  referrer: one(referrer, {
    fields: [registrationReferral.referrer],
    references: [referrer.id],
  }),
}));

/**
 * A RenewalReferral tracks individual occurences of referrals for ENS name renewals.
 */
export const renewalReferral = onchainTable(
  "renewal_referral",
  (t) => ({
    // keyed by any arbitrary unique id, usually `event.id`
    id: t.text().primaryKey(),

    referrer: t.hex().notNull(),
    referee: t.hex().notNull(),
    node: t.hex().notNull(),
    cost: t.bigint().notNull(),

    // chainId the transaction occurred on
    chainId: t.integer().notNull(),
    // transaction's hash
    transactionHash: t.hex().notNull(),
    // Block's Unix timestamp in seconds
    timestamp: t.bigint().notNull(),
  }),
  (t) => ({
    byReferee: index().on(t.referee),
    byReferrer: index().on(t.referrer),
  }),
);

export const renewalReferral_relations = relations(renewalReferral, ({ one, many }) => ({
  // RenewalReferral belongs to Referrer
  referrer: one(referrer, {
    fields: [renewalReferral.referrer],
    references: [referrer.id],
  }),
}));

/**
 * Referrer represents an individual referrer, keyed by unique `referrer` id (bytes32). It holds
 * aggregate statistics about referrals, namely the total value (in wei) they've referred to the
 * ENS protocol.
 */
export const referrer = onchainTable(
  "referral_totals",
  (t) => ({
    // keyed by Referrer's id (bytes32 hex)
    id: t.hex().primaryKey(),
    valueWei: t.bigint().notNull(),
  }),
  (t) => ({}),
);

export const referrer_relations = relations(referrer, ({ one, many }) => ({
  // Referrer has many RegistrationReferrals
  registrationReferrals: many(registrationReferral),

  // Referrer has many RenewalReferrals
  renewalReferrals: many(renewalReferral),
}));
