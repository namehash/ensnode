/**
 * Schema Definitions for tracking of ENS subregistries.
 */

import { index, onchainEnum, onchainTable, relations, uniqueIndex } from "ponder";

/**
 * Subregistries
 *
 * @see https://ensnode.io/docs/reference/terminology/#subregistry
 */
export const subregistries = onchainTable(
  "subregistries",
  (t) => ({
    /**
     * Subregistry ID
     *
     * Identifies the chainId and address of the smart contract associated
     * with the subregistry.
     *
     * Guaranteed to be a string formatted according to the CAIP-10 standard.
     *
     * @see https://chainagnostic.org/CAIPs/caip-10
     */
    subregistryId: t.text().primaryKey(),

    /**
     * The node (namehash) of the name the subregistry manages subnames of.
     * Example subregistry managed names:
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
 * Registration Lifecycles
 *
 * A "registration lifecycle" represents a single cycle of a name being
 * registered once followed by renewals (expiry date extensions) any number of
 * times.
 *
 * Note that this data model only tracks the *most recently created*
 * "registration lifecycle" record for a name and doesn't track
 * *all* "registration lifecycle" records for a name across time.
 * Therefore, if a name goes through multiple cycles of:
 * (registration -> expiry -> release) ->
 * (registration -> expiry -> release) -> etc..
 * this data model only stores data of the most recently created
 * "registration lifecycle".
 *
 * For now we make the following simplifying assumptions:
 * 1. That no two subregistries hold state for the same node.
 * 2. That the subregistry associated with the name X in the ENS root registry
 * exclusively holds state for subnames of X.
 *
 * These simplifying assumptions happen to be true for the scope of our
 * current indexing logic, but nothing in the ENS protocol fundamentally
 * forces this to always be true. Therefore this data model will need
 * refactoring in the future as our indexing logic expands to handle
 * more complex scenarios.
 */
export const registrationLifecycles = onchainTable(
  "registration_lifecycles",
  (t) => ({
    /**
     * The node (namehash) of the FQDN of the domain the registration lifecycle
     * is associated with.
     *
     * Guaranteed to be a subname of the node (namehash) of the subregistry
     * identified by `subregistryId`.
     *
     * Guaranteed to be a hex string representation of 32-bytes.
     */
    node: t.hex().primaryKey(),

    /**
     * Subregistry ID
     *
     * Identifies the chainId and address of the subregistry smart contract
     * that manages the registration lifecycle.
     *
     * Guaranteed to be a string formatted according to the CAIP-10 standard.
     *
     * @see https://chainagnostic.org/CAIPs/caip-10
     */
    subregistryId: t.text().notNull(),

    /**
     * Expires at
     *
     * Unix timestamp when the Registration Lifecycle is scheduled to expire.
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
 * Logical Registrar Actions
 *
 * This table models "logical actions" rather than "events" because a single
 * "logical action", such as a single registration or renewal, may emit
 * multiple onchain events from multiple contracts where each of those
 * individual events may only provide a subset of the data about the full
 * "logical action". Therefore, here we aggregate data about each
 * "logical action" that may be sourced from multiple onchain events from
 * multiple contracts.
 *
 * Each "logical action" in this table is associated with a single transaction.
 * However, it should be noted that a single transaction may perform any number
 * of "logical actions".
 *
 * For example, consider the "logical registrar action" of registering a direct
 * subname of .eth. This "logical action" spans interactions across multiple
 * contracts that emit multiple onchain events:
 *
 * 1. The "EthBaseRegistrar" contract emits a `NameRegistered` event enabling
 *    the tracking of data including:
 *    - `node`
 *    - `incrementalDuration`
 *    - `registrant`
 * 2. A "RegistrarController" contract emits its own `NameRegistered` event
 *    enabling the tracking of data including:
 *    - `baseCost`
 *    - `premium`
 *    - `total`
 *    - `encodedReferrer`
 *
 * Here we aggregate the state from both of these events into a single
 * "logical registrar action".
 */
export const registrarActions = onchainTable(
  "registrar_actions",
  (t) => ({
    /**
     * "Logical" Registrar Action ID
     *
     * The `id` value is a deterministic and globally unique identifier for
     * the "logical registrar action".
     *
     * The `id` value represents the *initial* onchain event associated with
     * the "logical registrar action", but the full state of
     * the "logical registrar action" is an aggregate across each of
     * the onchain events referenced in the `eventIds` field.
     *
     * Guaranteed to be the very first element in `eventIds` array.
     */
    id: t.text().primaryKey(),

    /**
     * The type of the "logical registrar action".
     */
    type: registrarActionType().notNull(),

    /**
     * Subregistry ID
     *
     * The ID of the subregistry the "logical registrar action" was taken on.
     *
     * Identifies the chainId and address of the associated subregistry smart
     * contract.
     *
     * Guaranteed to be a string formatted according to the CAIP-10 standard.
     *
     * @see https://chainagnostic.org/CAIPs/caip-10
     */
    subregistryId: t.text().notNull(),

    /**
     * The node (namehash) of the FQDN of the domain associated with
     * the "logical registrar action".
     *
     * Guaranteed to be a hex string representation of 32-bytes.
     */
    node: t.hex().notNull(),

    /**
     * Incremental Duration
     *
     * If `type` is "registration":
     *   - Represents the duration between `blockTimestamp` and
     *     the initial `expiresAt` value that the associated
     *     "registration lifecycle" will be initialized with.
     * If `type` is "renewal":
     *   - Represents the incremental increase in duration made to
     *     the `expiresAt` value in the associated "registration lifecycle".
     *
     * A "registration lifecycle" may be extended via renewal even after it
     * expires if it is still within its grace period.
     *
     * Consider the following scenario:
     *
     * The "registration lifecycle" of a direct subname of .eth is scheduled to
     * expire on Jan 1, midnight UTC. It is currently 30 days after this
     * expiration time. Therefore, there are currently another 60 days of grace
     * period remaining for this name. Anyone can still make a renewal to
     * extend the "registration lifecycle" of this name.
     *
     * Given this scenario, consider the following examples:
     *
     * 1. If a renewal is made with 10 days incremental duration,
     *    the "registration lifecycle" for this name will remain in
     *    an "expired" state, but it will now have another 70 days of
     *    grace period remaining.
     *
     * 2. If a renewal is made with 50 days incremental duration,
     *    the "registration lifecycle" for this name will no longer be
     *    "expired" and will become "active", but the "registration lifecycle"
     *    will now be scheduled to expire again in 20 days.
     *
     * After the "registration lifecycle" for a name becomes expired by more
     * than its grace period, it can no longer be renewed by anyone and is
     * considered "released". The name must first be registered again, starting
     * a new "registration lifecycle" of
     * active / expired / grace period / released.
     *
     * May be 0.
     *
     * Guaranteed to be a non-negative bigint value.
     */
    incrementalDuration: t.bigint().notNull(),

    /**
     * Base cost
     *
     * Base cost (before any `premium`) of Ether measured in units of Wei
     * paid to execute the "logical registrar action".
     *
     * May be 0.
     *
     * Guaranteed to be:
     * 1) null if and only if `total` is null.
     * 2) Otherwise, a non-negative bigint value.
     */
    baseCost: t.bigint(),

    /**
     * Premium
     *
     * "premium" cost (in excesses of the `baseCost`) of Ether measured in
     * units of Wei paid to execute the "logical registrar action".
     *
     * May be 0.
     *
     * Guaranteed to be:
     * 1) null if and only if `total` is null.
     * 2) Otherwise, zero when `type` is `renewal`.
     * 3) Otherwise, a non-negative bigint value.
     */
    premium: t.bigint(),

    /**
     * Total
     *
     * Total cost of Ether measured in units of Wei paid to execute
     * the "logical registrar action".
     *
     * May be 0.
     *
     * Guaranteed to be:
     * 1) null if and only if both `baseCost` and `premium` are null.
     * 2) Otherwise, a non-negative bigint value, equal to the sum of
     *    `baseCost` and `premium`.
     */
    total: t.bigint(),

    /**
     * Registrant
     *
     * Refers to address on the same `chainId` as referred by `subregistryId`
     * that initiated the "logical" Registrar Action and is paying
     * the `total` cost.
     *
     * Guaranteed to be a string formatted according to the CAIP-10 standard.
     */
    registrant: t.text().notNull(),

    /**
     * Encoded Referrer
     *
     * Represents the "raw" 32-byte "referrer" value emitted onchain in
     * association with the registrar action.
     *
     * Guaranteed to be:
     * 1) null if the emitted `eventIds` contain no information about a referrer.
     * 2) Otherwise, a hex string representation of 32-bytes.
     */
    encodedReferrer: t.hex(),

    /**
     * Decoded referrer
     *
     * Decoded referrer according to the subjective interpretation of
     * `encodedReferrer` defined for ENS Holiday Awards.
     *
     * Refers to address on the same `chainId` as referred by `subregistryId`.
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
     */
    timestamp: t.bigint().notNull(),

    /**
     * Transaction hash of the transaction on `chainId` chain associated with
     * the Logical Registrar Action.
     *
     * Note that a single transaction may be associated with any number of
     * "Logical" Registrar Actions.
     *
     * Guaranteed to be a string representation of 32-bytes.
     */
    transactionHash: t.hex().notNull(),

    /**
     * Event IDs
     *
     * Array of the eventIds that have contributed to the state of
     * the Logical Registrar Action.
     *
     * Each eventId is a deterministic and globally unique onchain event
     * identifier.
     *
     * Guarantees:
     * - Each eventId is of events that occurred on `chainId` within
     *  `blockNumber`.
     * - At least 1 eventId.
     * - Ordered chronologically (ascending) by logIndex within `blockNumber`
     *   on `chainId`.
     * - The first element in the array is equal to the `id` of
     *   the "logical registrar action".
     *
     * The following ideas are not generalized for ENS overall but happen to
     * be a characteristic of the scope of our current indexing logic:
     * 1. These id's always reference events emitted by
     *    a related "BaseRegistrar" contract.
     * 2. These id's optionally reference events emitted by
     *    a related "Registrar Controller" contract. This is because our
     *    current indexing logic doesn't guarantee to index
     *    all "Registrar Controller" contracts.
     *
     * Guaranteed to:
     * - Reference at least one event.
     * - Keep event references ordered chronologically, by event log index.
     */
    eventIds: t.text().array().notNull(),
  }),
  (t) => ({
    byDecodedReferrer: index().on(t.decodedReferrer),
    byTimestamp: index().on(t.timestamp),
  }),
);

/**
 * Logical Subregistry Action Metadata
 *
 * NOTE: This table is an internal implementation detail of ENSIndexer and
 * should not be queried outside of ENSIndexer.
 *
 * Building a "logical subregistry action" record may require data from
 * multiple onchain events. To help aggregate data from multiple events into
 * a single "logical subregistry action" ENSIndexer may temporarily store data
 * here to achieve this data aggregation.
 *
 * Note how multiple "logical subregistry actions" may be taken on
 * the same `node` in the same `transactionHash`. For example, consider
 * a case of a single transaction registering a name and subsequently renewing
 * it twice. While this may be silly it is technically possible and therefore
 * such cases must be considered. To support such cases, when
 * the last event handler for a "logical subregistry action" has completed its
 * processing the record referenced by the `logicalEventKey` must be removed.
 */
export const internal_subregistryActionMetadata = onchainTable(
  "_ensindexer_subregistry_action_metadata",
  (t) => ({
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
     * A string holding the `id` value of the existing "logical registrar action"
     * record that is currently being built as an aggregation of onchain events.
     *
     * May be used by subsequent event handlers to identify which
     * "logical registrar action" to aggregate additional indexed state into.
     */
    logicalEventId: t.text().notNull(),
  }),
);

/// Relations

/**
 * Subregistry Relations
 *
 * Each Subregistry is related to:
 * - 0 or more RegistrationLifecycles
 */
export const subregistryRelations = relations(subregistries, ({ many }) => ({
  registrationLifecycle: many(registrationLifecycles),
}));

/**
 * Registration Lifecycle Relations
 *
 * Each Registration Lifecycle is related to:
 * - exactly one Subregistry
 * - 0 or more "logical" RegistrarActions
 */
export const registrationLifecycleRelations = relations(
  registrationLifecycles,
  ({ one, many }) => ({
    subregistry: one(subregistries, {
      fields: [registrationLifecycles.subregistryId],
      references: [subregistries.subregistryId],
    }),

    registrarAction: many(registrarActions),
  }),
);

/**
 * "Logical" Registrar Action Relations
 *
 * Each "logical" Registrar Action is related to:
 * - exactly one Registration Lifecycle (note the docs on
 *   Registration Lifecycle explaining how these records may
 *   be recycled across time).
 */
export const registrarActionRelations = relations(registrarActions, ({ one }) => ({
  registrationLifecycle: one(registrationLifecycles, {
    fields: [registrarActions.node],
    references: [registrationLifecycles.node],
  }),
}));
