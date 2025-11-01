/**
 * Schema Definitions for tracking of ENS subregistries.
 */

import { index, onchainEnum, onchainTable, primaryKey, relations } from "ponder";

/**
 * Registrar Controller Table
 *
 * Tracks known registrar controller contracts that manage registrations
 * and renewals for known base registrars.
 */
export const registrarController = onchainTable(
  "registrar_controllers",
  (t) => ({
    /**
     * Chain ID that the transaction associated with the registrar controller
     * update occurred on.
     *
     * Guaranteed to be a non-negative integer value.
     */
    chainId: t.integer().notNull(),

    /**
     * The contract address of the registrar controller instance.
     */
    controllerAddress: t.hex().notNull(),

    /**
     * The registrar contract address that this controller manages.
     */
    registrarAddress: t.hex().notNull(),

    /**
     * Tells if registrar controller was added in to the registry contract,
     * and has not been removed yet.
     */
    isActive: t.boolean().notNull(),
  }),
  (t) => ({
    pk: primaryKey({ columns: [t.chainId, t.controllerAddress] }),
  }),
);

/**
 * Registration Table
 *
 * Tracks current registration state for nodes registered via subregistries.
 */
export const registration = onchainTable("registrations", (t) => ({
  /**
   * The node for which the registration was executed.
   *
   * Guaranteed to be a string representation of 32-bytes.
   */
  node: t.hex().primaryKey(),

  /**
   * The parent node under which the issues subnames.
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

  /**
   * Indicates whether the registration is managed by an indexed registrar controller contract.
   *
   * If true, it means that the registration was performed via a known
   * registrar controller contract.
   * Otherwise, it the registration was performed via unknown registrar controller address.
   */
  isControllerManaged: t.boolean().notNull().default(false),
}));

/**
 * Registrar Event Name Enum
 *
 * Names of Registrar Events.
 */
export const registrarEventName = onchainEnum("registrar_event_name", [
  "NameRegistered",
  "NameRenewed",
  "ControllerAdded",
  "ControllerRemoved",
]);

/**
 * Registrar Event
 *
 * Identifies an onchain event that was emitted by
 * Registrar contract, or Registrar Controller contract.
 */
export const registrarEvent = onchainTable("registrar_events", (t) => ({
  /**
   * Unique EVM event identifier for the registrar event.
   */
  id: t.text().primaryKey(),

  /**
   * Chain ID that the transaction associated with the registrar event
   * occurred on.
   *
   * Guaranteed to be a non-negative integer value.
   */
  chainId: t.integer().notNull(),

  /**
   * Address of a contract that emitted the registrar event.
   */
  contractAddress: t.hex().notNull(),

  /**
   * Number of the block that includes the registrar event.
   *
   * Guaranteed to be a non-negative bigint value.
   */
  blockNumber: t.bigint().notNull(),

  /**
   * Timestamp of the block that includes the registrar event.
   *
   * Guaranteed to be a non-negative bigint value.
   */
  blockTimestamp: t.bigint().notNull(),

  /**
   * Transaction hash of the transaction on `chainId` chain associated with
   * the registrar event.
   *
   * Guaranteed to be a string representation of 32-bytes.
   */
  transactionHash: t.hex().notNull(),

  /**
   * Log Index
   *
   * The index of a log within the `blockNumber` block on `chainId` chain
   * associated with the registrar event.
   *
   * Guaranteed to be a non-negative integer.
   */
  logIndex: t.integer().notNull(),

  /**
   * Name of registrar event.
   */
  name: registrarEventName().notNull(),
}));

/**
 * Registrar Action Type Enum
 *
 * Types of Registrar Actions.
 */
export const registrarActionType = onchainEnum("registrar_action_type", [
  "registration",
  "renewal",
]);

/**
 * Registrar Action Table
 *
 * Tracks registrar actions (registrations and renewals) performed
 * via subregistries.
 */
export const registrarAction = onchainTable(
  "registrar_actions",
  (t) => ({
    /**
     * Unique EVM event identifier for the registrar action.
     */
    id: t.text().primaryKey(),

    /**
     * Type of registrar action.
     */
    type: registrarActionType().notNull(),

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
     * Encoded referrer
     *
     * Guaranteed to be a string representation of 32-bytes.
     */
    encodedReferrer: t.hex().notNull(),

    /**
     * Decoded referrer
     *
     * Guaranteed to be a lowercase address, if `encodedReferrer` value
     * could be decoded. Otherwise it's the zero address.
     */
    decodedReferrer: t.hex().notNull(),

    /**
     * Incremental Duration
     *
     * Definition of "incremental duration" is
     * The incremental increase in the lifespan of the registration for
     * `node` that was active as of `timestamp`.
     *
     * Please consider the following situation:
     *
     * A registration of direct subname of Ethnames is scheduled to expire on
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
  }),
  (t) => ({
    byRegistrant: index().on(t.registrant),
    byReferrer: index().on(t.decodedReferrer),
  }),
);

// Relations

/**
 * Registrar Controller Relations
 *
 * - exactly one registrar
 * - many registrar events
 */
export const registrarControllerRelations = relations(registrarController, ({ many }) => ({
  registrarEvents: many(registrarEvent),
}));

/**
 * Registrar Event Relations
 *
 * - at most one Registrar Controller
 * - at most one Registrar Action
 */
export const registrarEventRelations = relations(registrarEvent, ({ one }) => ({
  registrarController: one(registrarController, {
    fields: [registrarEvent.chainId, registrarEvent.contractAddress],
    references: [registrarController.chainId, registrarController.controllerAddress],
  }),

  registrarAction: one(registrarAction, {
    fields: [registrarEvent.id],
    references: [registrarAction.id],
  }),
}));

/**
 * Registrar Action Relations
 *
 * - exactly one Registrar Event
 * - exactly one Registration
 */
export const registrarActionRelations = relations(registrarAction, ({ one }) => ({
  registrarEvent: one(registrarEvent, {
    fields: [registrarAction.id],
    references: [registrarEvent.id],
  }),

  registration: one(registration, {
    fields: [registrarAction.node],
    references: [registration.node],
  }),
}));

/**
 * Registration Relations
 *
 * - many Registrar Actions
 */
export const registrationRelations = relations(registration, ({ many }) => ({
  registrarActions: many(registrarAction),
}));
