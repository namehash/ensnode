/**
 * Schema Definitions for tracking of ENS subregistries.
 */

import { index, onchainEnum, onchainTable, relations, uniqueIndex } from "ponder";

/**
 * Subregistry
 */
export const subregistry = onchainTable(
  "subregistries",
  (t) => ({
    /**
     * Subregistry ID
     *
     * Guaranteed to be a string formatted according to the CAIP-10 standard.
     *
     * @see https://chainagnostic.org/CAIPs/caip-10
     */
    subregistryId: t.text().primaryKey(),

    /**
     * The node of a name the subregistry manages. Example managed names:
     * - `eth`
     * - `base.eth`
     * - `linea.eth`
     *
     * Guaranteed to be a hex string representation of 32-bytes.
     */
    node: t.hex().notNull(),
  }),
  (t) => ({
    uniqueNode: uniqueIndex().on(t.node),
  }),
);

/**
 * Registration Lifecycle
 */
export const registrationLifecycle = onchainTable(
  "registration_lifecycles",
  (t) => ({
    /**
     * The node of the FQDN of the domain this is associated with,
     * guaranteed to be a subname of the associated subregistry
     * for which the registration was executed.
     *
     * Guaranteed to be a hex string representation of 32-bytes.
     */
    node: t.hex().primaryKey(),

    /**
     * Subregistry ID
     *
     * Guaranteed to be a string formatted according to the CAIP-10 standard.
     *
     * @see https://chainagnostic.org/CAIPs/caip-10
     */
    subregistryId: t.text().notNull(),

    /**
     * Unix timestamp when Registration Lifecycle is scheduled to expire.
     */
    expiresAt: t.bigint().notNull(),
  }),
  (t) => ({
    bySubregistry: index().on(t.subregistryId),
  }),
);

/**
 * "Logical" Registrar Action Type Enum
 *
 * Types of "logical" Registrar Actions.
 */
export const registrarActionType = onchainEnum("registrar_action_type", [
  "registration",
  "renewal",
]);

/**
 * "Logical" Registrar Action
 *
 * Represents a "logical" RegistrarAction, but the state recorded for
 * a "logical" RegistrarAction may be an aggregate across multiple onchain
 * events that may be distributed across multiple contracts (such as
 * a RegistrarController and its associated BaseRegistrar) within
 * a single transaction.
 *
 * Consider the following situation:
 * 1) When someone makes a new registration, multiple contracts take part in
 *    the registration process.
 * 2) In order to build a single "logical" Registrar Action record,
 *    we may need information from one or more events. For example,
 *    the `NameRegistered` event from the BaseRegistrar contract includes
 *    information for fields like:
 *    - `node`
 *    - `incrementalDuration`
 *    - `registrant`
 *    We use this event to initiate the "logical" Registrar Action record.
 *
 *    Another event we may index (and in most cases we do) is
 *    `NameRegistered` from RegistrarController contract, which may include:
 *    - `baseCost`
 *    - `premium`
 *    - `total`
 *    - `encodedReferrer`
 *    We use this event to update the "logical" Registrar Action record.
 *
 * Both of those events contribute to a single "logical" Registrar Action record.
 */
export const registrarAction = onchainTable(
  "registrar_action",
  (t) => ({
    /**
     * "Logical" Registrar Action ID
     *
     * The `id` value is a deterministic identifier for the initial onchain event
     * associated with the "logical" RegistrarAction.
     *
     * Guaranteed to be the very first element in `eventIds` array.
     */
    id: t.text().primaryKey(),

    /**
     * Subregistry ID
     *
     * The ID of the subregistry which executed the "logical" Registrar Action.
     *
     * Guaranteed to be a string formatted according to the CAIP-10 standard.
     *
     * @see https://chainagnostic.org/CAIPs/caip-10
     */
    subregistryId: t.text().notNull(),

    /**
     * The node  (namehash) of the name associated with the "logical" Registrar
     * Action.
     *
     * Guaranteed to be a hex string representation of 32-bytes.
     */
    node: t.hex().notNull(),

    /**
     * Type of the "logical" Registrar Action.
     */
    type: registrarActionType().notNull(),

    /**
     * Incremental Duration
     *
     * Definition of "incremental duration" is
     * the incremental increase in the lifespan of the registration for
     * `node` that was active as of `blockTimestamp`.
     *
     * Please consider the following situation:
     *
     * A registration of direct subname of .eth name is scheduled to expire on
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
     * Base cost of the "logical" Registrar Action.
     *
     * Guaranteed to be:
     * 1) null if and only if `total` is null.
     * 2) Otherwise, a non-negative bigint value for registrations.
     */
    baseCost: t.bigint(),

    /**
     * Premium of the "logical" Registrar Action.
     *
     * Guaranteed to be:
     * 1) null if and only if `total` is null.
     * 2) Otherwise, zero when `type` is `renewal`.
     * 3) Otherwise, a non-negative bigint value `type` is `registration`.
     */
    premium: t.bigint(),

    /**
     * Total cost of performing the "logical" Registrar Action.
     *
     * Guaranteed to be:
     * 1) null if and only if both `baseCost` and `premium` are null.
     * 2) Otherwise, a non-negative bigint value, equal to the sum of
     *    `baseCost` and `premium`.
     */
    total: t.bigint(),

    /**
     * Account that initiated the "logical" Registrar Action and
     * is paying the `total` cost.
     */
    registrant: t.hex().notNull(),

    /**
     * Encoded Referrer
     *
     * Represents the "raw" 32-byte "referrer" value emitted onchain in
     * association with the registrar action.
     *
     * If a registrar / registrar controller doesn't support the concept of
     * referrers then this field is set to null.
     *
     * Guaranteed to be:
     * 1) null if a registrar / registrar controller doesn't support
     *    the concept of referrers.
     * 2) Otherwise, a hex string representation of 32-bytes.
     */
    encodedReferrer: t.hex(),

    /**
     * Decoded referrer
     *
     * Guaranteed to be:
     * 1) null if `encodedReferrer` is null.
     * 2) Otherwise, a valid EVM address (including zero address).
     */
    decodedReferrer: t.hex(),

    /**
     * Number of the block that includes the "logical" Registrar Action.
     *
     * Guaranteed to be a non-negative bigint value.
     */
    blockNumber: t.bigint().notNull(),

    /**
     * Timestamp of the block that includes the "logical" Registrar Action.
     *
     * Guaranteed to be a non-negative bigint value.
     */
    blockTimestamp: t.bigint().notNull(),

    /**
     * Transaction hash of the transaction on `chainId` chain associated with
     * the "logical" Registrar Action.
     *
     * Guaranteed to be a string representation of 32-bytes.
     */
    transactionHash: t.hex().notNull(),

    /**
     * Event IDs
     *
     * An array of IDs referencing all onchain events, ordered by logIndex
     * that have ever contributed to the state of the "logical" Registrar Action.
     *
     * For example, the IDs will:
     * 1) Always reference event emitted by BaseRegistrar contract.
     * 2) Optionally reference event emitted by Registrar Controller contract,
     *    if and only if the given Registrar Controller contract is indexed.
     *
     * Note: Some Registrar Controller contracts that are not indexed
     *.      as they remain unknown to ENSIndexer at the moment.
     *
     * The `id` value is guaranteed to be the initial element of that array.
     *
     * Guaranteed to:
     * - Reference at least one event.
     * - Keep event references ordered chronologically, by event log index.
     */
    eventIds: t.text().array().notNull(),
  }),
  (t) => ({
    byRegistrant: index().on(t.registrant),
    byDecodedReferrer: index().on(t.decodedReferrer),
    byBlockTimestamp: index().on(t.blockTimestamp),
  }),
);

/**
 * "Logical" Subregistry Action Metadata
 *
 * Building a single "logical" Subregistry Action requires data from multiple
 * onchain events. While handling the first event, we create a temporary
 * "Logical" Subregistry Action Metadata record where we store `logicalEventId`.
 *
 * The `logicalEventId` is used by subsequent event handlers to update
 * the "logical" Subregistry Action record. In order to get `logicalEventId`,
 * an event handler creates `logicalEventKey` from the currently handled
 * onchain event.
 *
 * The very last event handler must remove the record referenced with
 * `logicalEventKey` value.
 */
export const tempLogicalSubregistryAction = onchainTable("_subregistry_action_metadata", (t) => ({
  /**
   * Logical Event Key
   *
   * A string formatted as:
   * `{chainId}:{subregistryAddress}:{node}:{transactionHash}`
   */
  logicalEventKey: t.text().primaryKey(),

  /**
   * Logical Event ID
   *
   * A string holding the ID value to an existing "logical" Registrar Action
   * record that was inserted while e use this event to initiate
   * the "logical" Registrar Action record.
   */
  logicalEventId: t.text().notNull(),
}));

/// Relations

/**
 * Subregistry Relations
 *
 * - many RegistrationLifecycles
 */
export const subregistryRelations = relations(subregistry, ({ many }) => ({
  registrationLifecycle: many(registrationLifecycle),
}));

/**
 * Registration Lifecycle Relations
 *
 * - exactly one Subregistry
 * - many "logical" RegistrarActions
 */
export const registrationLifecycleRelations = relations(registrationLifecycle, ({ one, many }) => ({
  subregistry: one(subregistry, {
    fields: [registrationLifecycle.subregistryId],
    references: [subregistry.subregistryId],
  }),

  registrarAction: many(registrarAction),
}));

/**
 * "Logical" Registrar Action Relations
 *
 * - exactly one Registration Lifecycle
 */
export const logicalRegistrarActionRelations = relations(registrarAction, ({ one }) => ({
  registrationLifecycle: one(registrationLifecycle, {
    fields: [registrarAction.node],
    references: [registrationLifecycle.node],
  }),
}));
