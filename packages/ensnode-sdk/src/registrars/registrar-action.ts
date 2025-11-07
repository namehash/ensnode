import type { EncodedReferrer } from "@namehash/ens-referrals";

export type { EncodedReferrer } from "@namehash/ens-referrals";
export { decodeEncodedReferrer, zeroEncodedReferrer } from "@namehash/ens-referrals";

import type { Address, Hash } from "viem";

import {
  type BlockRef,
  type Duration,
  type PriceEth,
  type SerializedPriceEth,
  serializePriceEth,
} from "../shared";
import {
  type RegistrationLifecycle,
  type RegistrationLifecycleWithDomain,
  type SerializedRegistrationLifecycle,
  type SerializedRegistrationLifecycleWithDomain,
  serializeRegistrationLifecycle,
  serializeRegistrationLifecycleWithDomain,
} from "./registration-lifecycle";

/**
 * Globally unique, deterministic ID of an indexed onchain event.
 */
export type RegistrarActionEventId = string;

/**
 * Types of "logical registrar action".
 */
export const RegistrarActionTypes = {
  Registration: "registration",
  Renewal: "renewal",
} as const;

export type RegistrarActionType = (typeof RegistrarActionTypes)[keyof typeof RegistrarActionTypes];

/**
 * Pricing information for a "logical registrar action".
 */
export interface RegistrarActionPricingAvailable {
  /**
   * Base cost
   *
   * Base cost (before any `premium`) of Ether measured in units of Wei
   * paid to execute the "logical registrar action".
   *
   * May be 0.
   */
  baseCost: PriceEth;

  /**
   * Premium
   *
   * "premium" cost (in excesses of the `baseCost`) of Ether measured in
   * units of Wei paid to execute the "logical registrar action".
   *
   * May be 0.
   */
  premium: PriceEth;

  /**
   * Total
   *
   * Total cost of Ether measured in units of Wei paid to execute
   * the "logical registrar action".
   *
   * May be 0.
   */
  total: PriceEth;
}

/**
 * Pricing information for a "logical registrar action" when
 * there is no known pricing data.
 */
export interface RegistrarActionPricingUnknown {
  /**
   * Base cost
   *
   * Base cost (before any `premium`) of Ether measured in units of Wei
   * paid to execute the "logical registrar action".
   */
  baseCost: null;

  /**
   * Premium
   *
   * "premium" cost (in excesses of the `baseCost`) of Ether measured in
   * units of Wei paid to execute the "logical registrar action".
   */
  premium: null;

  /**
   * Total
   *
   * Total cost of Ether measured in units of Wei paid to execute
   * the "logical registrar action".
   */
  total: null;
}

export type RegistrarActionPricing =
  | RegistrarActionPricingAvailable
  | RegistrarActionPricingUnknown;

export function isRegistrarActionPricingAvailable(
  registrarActionPricing: RegistrarActionPricing,
): registrarActionPricing is RegistrarActionPricingAvailable {
  const { baseCost, premium, total } = registrarActionPricing;

  return baseCost !== null && premium !== null && total !== null;
}

/**
 * * Referral information for performing a "logical registrar action".
 */
export interface RegistrarActionReferralAvailable {
  /**
   * Encoded Referrer
   *
   * Represents the "raw" 32-byte "referrer" value emitted onchain in
   * association with the registrar action.
   */
  encodedReferrer: EncodedReferrer;

  /**
   * Decoded Referrer
   *
   * Decoded referrer according to the subjective interpretation of
   * `encodedReferrer` defined for ENS Holiday Awards.
   *
   * Identifies the interpreted address of the referrer.
   * The "chainId" of this address is the same as is referenced in
   * `subregistryId`.
   *
   * May be the "zero address" to represent that an `encodedReferrer` is
   * defined but that it is interpreted as no referrer.
   */
  decodedReferrer: Address;
}

/**
 * Referral information for performing a "logical registrar action" when
 * registrar controller does not implement referrals.
 */
export interface RegistrarActionReferralNotApplicable {
  /**
   * Encoded Referrer
   *
   * Represents the "raw" 32-byte "referrer" value emitted onchain in
   * association with the registrar action.
   */
  encodedReferrer: null;

  /**
   * Decoded Referrer
   *
   * Decoded referrer according to the subjective interpretation of
   * `encodedReferrer` defined for ENS Holiday Awards.
   *
   */
  decodedReferrer: null;
}

export type RegistrarActionReferral =
  | RegistrarActionReferralAvailable
  | RegistrarActionReferralNotApplicable;

export function isRegistrarActionReferralAvailable(
  registrarActionReferral: RegistrarActionReferral,
): registrarActionReferral is RegistrarActionReferralAvailable {
  const { encodedReferrer, decodedReferrer } = registrarActionReferral;

  return encodedReferrer !== null && decodedReferrer !== null;
}

/**
 * "Logical registrar action"
 *
 * Represents a state of "logical registrar action". May be built using data
 * from multiple events within the same "logical" registration / renewal action.
 */
export interface RegistrarAction {
  /**
   * "Logical registrar action" ID
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
  id: RegistrarActionEventId;

  /**
   * The type of the "logical registrar action".
   */
  type: RegistrarActionType;

  /**
   *
   * Incremental Duration
   *
   * If `type` is "registration":
   *   - Represents the duration between `block.timestamp` and
   *     the initial `registrationLifecycle.expiresAt` value that the associated
   *     "registration lifecycle" will be initialized with.
   * If `type` is "renewal":
   *   - Represents the incremental increase in duration made to
   *     the `registrationLifecycle.expiresAt` value in the associated
   *     "registration lifecycle".
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
  incrementalDuration: Duration;

  /**
   * Registrant
   *
   * Identifies the address that initiated the "logical registrar action" and
   * is paying the `pricing.total` cost (if applicable).
   *
   * It may not be the owner of the name:
   * 1. When a name is registered, the initial owner of the name may be
   *    distinct from the registrant.
   * 2. There are no restrictions on who may renew a name.
   *    Therefore the owner of the name may be distinct from the registrant.
   *
   * The "chainId" of this address is the same as is referenced in
   * `registrationLifecycle.subregistry.subregistryId`.
   */
  registrant: Address;

  /**
   * Registration Lifecycle associated with this "logical registrar action".
   */
  registrationLifecycle: RegistrationLifecycle;

  /**
   * Pricing information associated with this "logical registrar action".
   */
  pricing: RegistrarActionPricing;

  /**
   * Referral information associated with this "logical registrar action".
   */
  referral: RegistrarActionReferral;

  /**
   * Block ref
   *
   * References the block where the "logical registrar action" was executed.
   *
   * The "chainId" of this block is the same as is referenced in
   * `registrationLifecycle.subregistry.subregistryId`.
   */
  block: BlockRef;

  /**
   * Transaction hash
   *
   * Transaction hash of the transaction associated with
   * the "logical registrar action".
   *
   * The "chainId" of this transaction is the same as is referenced in
   * `registrationLifecycle.subregistry.subregistryId`.
   *
   * Note that a single transaction may be associated with any number of
   * "logical registrar actions".
   */
  transactionHash: Hash;

  /**
   * Event IDs
   *
   * Array of the eventIds that have contributed to the state of
   * the "logical registrar action" record.
   *
   * Each eventId is a deterministic and globally unique onchain event
   * identifier.
   *
   * Guarantees:
   * - Each eventId is of events that occurred within the block
   *   referenced by `block.number`.
   * - At least 1 eventId.
   * - Ordered chronologically (ascending) by logIndex within `block.number`.
   * - The first element in the array is equal to the `id` of
   *   the overall "logical registrar action" record.
   *
   * The following ideas are not generalized for ENS overall but happen to
   * be a characteristic of the scope of our current indexing logic:
   * 1. These id's always reference events emitted by
   *    a related "BaseRegistrar" contract.
   * 2. These id's optionally reference events emitted by
   *    a related "Registrar Controller" contract. This is because our
   *    current indexing logic doesn't guarantee to index
   *    all "Registrar Controller" contracts.
   */
  eventIds: [RegistrarActionEventId, ...RegistrarActionEventId[]];
}

export interface RegistrarActionWithDomain extends Omit<RegistrarAction, "registrationLifecycle"> {
  /**
   * Registration Lifecycle associated with this "logical registrar action".
   *
   * Includes information about related domain.
   */
  registrationLifecycle: RegistrationLifecycleWithDomain;
}

/**
 * Serialized representation of {@link RegistrarActionPricingUnknown}.
 */
export type SerializedRegistrarActionPricingUnknown = RegistrarActionPricingUnknown;

/**
 * Serialized representation of {@link RegistrarActionPricingAvailable}.
 */
export interface SerializedRegistrarActionPricingAvailable {
  baseCost: SerializedPriceEth;

  premium: SerializedPriceEth;

  total: SerializedPriceEth;
}

/**
 * Serialized representation of {@link RegistrarActionPricing}.
 */
export type SerializedRegistrarActionPricing =
  | SerializedRegistrarActionPricingAvailable
  | SerializedRegistrarActionPricingUnknown;

/**
 * Serialized representation of {@link RegistrarAction}.
 */
export interface SerializedRegistrarAction
  extends Omit<RegistrarAction, "registrationLifecycle" | "pricing"> {
  registrationLifecycle: SerializedRegistrationLifecycle;

  pricing: SerializedRegistrarActionPricing;
}

export interface SerializedRegistrarActionWithDomain
  extends Omit<RegistrarAction, "registrationLifecycle" | "pricing"> {
  registrationLifecycle: SerializedRegistrationLifecycleWithDomain;

  pricing: SerializedRegistrarActionPricing;
}

export function serializeRegistrarActionPricing(
  pricing: RegistrarActionPricing,
): SerializedRegistrarActionPricing {
  if (isRegistrarActionPricingAvailable(pricing)) {
    return {
      baseCost: serializePriceEth(pricing.baseCost),
      premium: serializePriceEth(pricing.premium),
      total: serializePriceEth(pricing.total),
    } satisfies SerializedRegistrarActionPricingAvailable;
  }

  return pricing satisfies SerializedRegistrarActionPricingUnknown;
}

export function serializeRegistrarAction(
  registrarAction: RegistrarAction,
): SerializedRegistrarAction {
  return {
    id: registrarAction.id,
    type: registrarAction.type,
    incrementalDuration: registrarAction.incrementalDuration,
    registrant: registrarAction.registrant,
    registrationLifecycle: serializeRegistrationLifecycle(registrarAction.registrationLifecycle),
    pricing: serializeRegistrarActionPricing(registrarAction.pricing),
    referral: registrarAction.referral,
    block: registrarAction.block,
    transactionHash: registrarAction.transactionHash,
    eventIds: registrarAction.eventIds,
  };
}

export function serializeRegistrarActionWithDomain(
  registrarAction: RegistrarActionWithDomain,
): SerializedRegistrarActionWithDomain {
  return {
    ...serializeRegistrarAction(registrarAction),
    registrationLifecycle: serializeRegistrationLifecycleWithDomain(
      registrarAction.registrationLifecycle,
    ),
  };
}
