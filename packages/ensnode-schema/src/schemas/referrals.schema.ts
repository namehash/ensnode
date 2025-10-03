/**
 * Schema Definitions for tracking of ENS referrals.
 */

import { index, onchainTable, relations } from "ponder";

/**
 * A RegistrationReferral tracks individual occurences of referrals for ENS name registrations.
 */
export const ext_registrationReferral = onchainTable(
  "ext_registration_referral",
  (t) => ({
    // keyed by any arbitrary unique id, usually `event.id`
    id: t.text().primaryKey(),

    referrerId: t.hex().notNull(),
    domainId: t.text().notNull(),
    refereeId: t.hex().notNull(),
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
    byRefereeId: index().on(t.refereeId),
    byReferrerId: index().on(t.referrerId),
  }),
);

export const ext_registrationReferral_relations = relations(
  ext_registrationReferral,
  ({ one, many }) => ({
    // RegistrationReferral references one Referrer
    referrer: one(ext_referrer, {
      fields: [ext_registrationReferral.referrerId],
      references: [ext_referrer.id],
    }),
  }),
);

/**
 * A RenewalReferral tracks individual occurences of referrals for ENS name renewals.
 */
export const ext_renewalReferral = onchainTable(
  "ext_renewal_referral",
  (t) => ({
    // keyed by any arbitrary unique id, usually `event.id`
    id: t.text().primaryKey(),

    referrerId: t.hex().notNull(),
    refereeId: t.hex().notNull(),
    domainId: t.text().notNull(),
    cost: t.bigint().notNull(),

    // chainId the transaction occurred on
    chainId: t.integer().notNull(),
    // transaction's hash
    transactionHash: t.hex().notNull(),
    // Block's Unix timestamp in seconds
    timestamp: t.bigint().notNull(),
  }),
  (t) => ({
    byRefereeId: index().on(t.refereeId),
    byReferrerId: index().on(t.referrerId),
  }),
);

export const ext_renewalReferral_relations = relations(ext_renewalReferral, ({ one, many }) => ({
  // RenewalReferral references one Referrer
  referrer: one(ext_referrer, {
    fields: [ext_renewalReferral.referrerId],
    references: [ext_referrer.id],
  }),
}));

/**
 * Referrer represents an individual referrer, keyed by their onchain address. It holds aggregate
 * statistics about referrals, namely the total value (in wei) they've referred to the ENS protocol.
 */
export const ext_referrer = onchainTable(
  "ext_referral_totals",
  (t) => ({
    // keyed by Referrer's id (bytes32 hex)
    id: t.hex().primaryKey(),
    valueWei: t.bigint().notNull(),
  }),
  (t) => ({}),
);

export const ext_referrer_relations = relations(ext_referrer, ({ one, many }) => ({
  // Referrer has many RegistrationReferrals
  registrationReferrals: many(ext_registrationReferral),

  // Referrer has many RenewalReferrals
  renewalReferrals: many(ext_renewalReferral),
}));
