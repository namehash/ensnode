/**
 * Schema Definitions for tracking of ENS subregistries.
 */

import { index, onchainEnum, onchainTable, relations } from "ponder";

/**
 * Subregistry Registration Table
 *
 * Tracks current registration state for nodes registered via subregistries.
 */
export const subregistry_registration = onchainTable("subregistry_registration", (t) => ({
  /**
   * The node for which the registration was executed.
   *
   * Guaranteed to be a string representation of 32-bytes.
   */
  node: t.hex().primaryKey(),

  /**
   * The parent node under which the subregistry issues subnames.
   *
   * Guaranteed to be a string representation of 32-bytes.
   */
  parentNode: t.hex().notNull(),

  /**
   * Unix timestamp when registration expires.
   *
   * Guaranteed to be a non-negative bigint value.
   */
  expiresAt: t.bigint().notNull(),
}));

/**
 * Subregistry Registrar Action Type Enum
 *
 * Types of Registrar Actions.
 */
export const subregistry_registrarActionType = onchainEnum("registrar_action_type", [
  "registration",
  "renewal",
]);

/**
 * Subregistry Registrar Action Table
 *
 * Tracks registrar actions (registrations and renewals) performed
 * via subregistries.
 */
export const subregistry_registrarAction = onchainTable(
  "subregistry_registration_action",
  (t) => ({
    /**
     * Unique EVM event identifier for the registrar action.
     */
    id: t.text().primaryKey(),

    /**
     * Type of registrar action.
     */
    type: subregistry_registrarActionType().notNull(),

    /**
     * Node for which the registrar action was executed.
     */
    node: t.hex().notNull(),

    /**
     * Base cost of the registrar action.
     *
     * Guaranteed to be a non-negative bigint value.
     */
    baseCost: t.bigint().notNull(),

    /**
     * Premium of the registrar action.
     *
     * Guaranteed to be a bigint value, such that:
     * - non-negative for registrations.
     * - zero for renewals.
     */
    premium: t.bigint().notNull(),

    /**
     * Total cost of performing the registrar action.
     *
     * Guaranteed to be a non-negative bigint value,
     * and equal to the sum of `baseCost` and `premium`.
     */
    total: t.bigint().notNull(),

    /**
     * Account that initiated the registrar action and
     * is paying the `total` cost.
     */
    registrant: t.hex().notNull(),

    /**
     * Raw referrer
     *
     * Guaranteed to be a string representation of 32-bytes.
     */
    rawReferrer: t.hex().notNull(),

    /**
     * Interpreted referrer
     *
     * Guaranteed to be a lowercase address, if `rawReferrer` value
     * could be interpreted. Otherwise it's the zero address.
     */
    interpretedReferrer: t.hex().notNull(),

    /**
     * Incremental Duration
     *
     * Definition of "incremental duration" is
     * the incremental increase in the lifespan of the current registration.
     *
     * Please consider the following situation:
     *
     * A registration of direct subname of .eth is scheduled to expire on
     * Jan 1, midnight UTC. It is currently 30 days after this expiration time.
     * Therefore, there are currently another 60 days of grace period remaining
     * for this name. Anyone can now make a renewal of this name.
     *
     * There are two possible scenarios when a renewal is made:
     *
     * 1) If a renewal is made for 10 days incremental duration,
     *    this name remains in an "expired" state, but it now
     *    has another 70 days of grace period remaining.
     *
     * 2) If a renewal is made for 50 days incremental duration,
     *    this name is no longer "expired" and is active, but it now
     *    expires in 20 days.
     *
     * After the latest registration of a direct subname becomes expired by
     * more than the grace period, it can no longer be renewed by anyone.
     * It must first be registered again, starting a new registration lifecycle of
     * expiry / grace period / etc.
     *
     * Guaranteed to be a non-negative bigint value.
     */
    incrementalDuration: t.bigint().notNull(),

    /**
     * Block timestamp of the transaction on `chainId` associated with
     * the registrar action.
     *
     * Guaranteed to be a non-negative bigint value.
     */
    blockTimestamp: t.bigint().notNull(),

    /**
     * Chain ID that the transaction associated with the registrar action
     * occurred on.
     *
     * Guaranteed to be a non-negative integer value.
     */
    chainId: t.integer().notNull(),

    /**
     * Transaction hash of the transaction on `chainId` associated with
     * the registrar action.
     *
     * Guaranteed to be a string representation of 32-bytes.
     */
    transactionHash: t.hex().notNull(),
  }),
  (t) => ({
    byRegistrant: index().on(t.registrant),
    byReferrer: index().on(t.interpretedReferrer),
  }),
);

export const subregistry_registrarAction_relations = relations(
  subregistry_registrarAction,
  ({ one, many }) => ({
    // RegistrarAction belongs to subregistry_registrarAction
    referrer: one(subregistry_registration, {
      fields: [subregistry_registrarAction.node],
      references: [subregistry_registration.node],
    }),
  }),
);

export const subregistry_registration_relations = relations(
  subregistry_registration,
  ({ one, many }) => ({
    // Registration has many RegistrarAction
    registrarActions: many(subregistry_registrarAction),
  }),
);
