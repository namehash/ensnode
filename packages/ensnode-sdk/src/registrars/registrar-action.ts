import type { EncodedReferrer } from "@namehash/ens-referrals";

export type { EncodedReferrer } from "@namehash/ens-referrals";
export { decodeEncodedReferrer, zeroEncodedReferrer } from "@namehash/ens-referrals";

import type { Address, Hash } from "viem";

import type { BlockRef, Duration, PriceEth } from "../shared";
import type { RegistrationLifecycle } from "./registration-lifecycle";

/**
 * Globally unique, deterministic ID of an indexed onchain event.
 */
type RegistrarActionEventId = string;

/**
 * Types of "logical" Registrar Action.
 */
export const RegistrarActionTypes = {
  Registration: "registration",
  Renewal: "renewal",
} as const;

export type RegistrarActionType = (typeof RegistrarActionTypes)[keyof typeof RegistrarActionTypes];

/**
 * Prices information for performing the "logical" registrar action.
 */
export interface RegistrarActionPricingAvailable {
  /**
   * Base cost
   *
   * Note: the "baseCost.amount" may be`0` or more.
   */
  baseCost: PriceEth;

  /**
   * Premium
   *
   * Note: the "premium.amount" may be`0` or more.
   */
  premium: PriceEth;

  /**
   * Total cost for performing the registrar action.
   *
   * Sum of `baseCost.amount` and `premium.amount`.
   *
   * Note: the "total.amount" may be`0` or more.
   */
  total: PriceEth;
}

/**
 * Prices information for performing the "logical" registrar action.
 */
export interface RegistrarActionPricingNotApplicable {
  /**
   * Base cost
   *
   * Always null, as `total` is null.
   */
  baseCost: null;

  /**
   * Premium
   *
   * Always null, as `total` is null.
   */
  premium: null;

  /**
   * Total cost for performing the registrar action.
   *
   * Always null, as `baseCost` and `premium` are both null.
   */
  total: null;
}

export type RegistrarActionPricing =
  | RegistrarActionPricingAvailable
  | RegistrarActionPricingNotApplicable;

export function isRegistrarActionPricingAvailable(
  registrarActionPricing: RegistrarActionPricing,
): registrarActionPricing is RegistrarActionPricingAvailable {
  const { baseCost, premium, total } = registrarActionPricing;

  return baseCost !== null && premium !== null && total !== null;
}

/**
 * Referrals information for performing the "logical" registrar action.
 */
export interface RegistrarActionReferralAvailable {
  /**
   * Encoded Referrer
   *
   * Represents the "raw" 32-byte "referrer" value emitted onchain in
   * association with the registrar action.
   *
   * If a registrar / registrar controller supports the concept of
   * referrers then this field is set (non-null).
   */
  encodedReferrer: EncodedReferrer;

  /**
   * Decoded Referrer
   *
   * Represents ENSNode's subjective interpretation of
   * {@link RegistrarAction.encodedReferrer}.
   *
   * Invariants:
   * - If the first `12`-bytes of "encodedReferrer" are all `0`,
   *   then "decodedReferrer" is the last `20`-bytes of "encodedReferrer",
   *   else: "decodedReferrer" is the zero address.
   */
  decodedReferrer: Address;
}

/**
 * Referrals information for performing the "logical" registrar action.
 */
export interface RegistrarActionReferralNotApplicable {
  /**
   * Encoded Referrer
   *
   * Always null, as registrar / registrar controller doesn't support the concept of
   * referrers.
   */
  encodedReferrer: null;

  /**
   * Decoded Referrer
   *
   *
   * Always null, as `encodedReferrer` is null.
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
 * "Logical" Registrar Action
 *
 * Represents a state of "logical" Registrar Action. May be built using data
 * from multiple events within the same "logical" registration / renewal action.
 */
export interface RegistrarAction {
  /**
   * Registrar Action ID
   *
   * This is ID of the event which initiated the "logical" Registrar Action.
   */
  id: RegistrarActionEventId;

  /**
   * Registrar Action Type
   *
   * The type of the Registrar Action.
   */
  type: RegistrarActionType;

  /**
   * Incremental Duration
   *
   * Represents the incremental increase in the duration of the lifespan of
   * the registration for `node` that was active as of `timestamp`.
   * Measured in seconds.
   *
   * A name with an active registration can be renewed at any time.
   *
   * Names that have expired may still be renewable.
   *
   * For example: assume the registration of a direct subname of Ethnames is
   * scheduled to expire on Jan 1, midnight UTC. It is currently 30 days after
   * this expiration time. Therefore, there are currently another 60 days of
   * grace period remaining for this name. Anyone can still make
   * a renewal of this name.
   *
   * Consider the following scenarios for renewals of a name that
   * has expired but is still within its grace period:
   *
   * 1) Expired (in grace period) -> Expired (in grace period):
   *    If a renewal is made for 10 days incremental duration,
   *    this name remains in an "expired" (in grace period) state, but it now
   *    has 70 days of grace period remaining instead of only 60.
   *
   * 2) Expired (in grace period) -> Active:
   *    If a renewal is made for 50 days incremental duration,
   *    this name is no longer "expired" (in grace period) and is active, but it now
   *    expires and begins a new grace period in 20 days.
   *
   * After the latest registration of a direct subname becomes expired by
   * more than the grace period, it can no longer be renewed by anyone.
   * It must first be registered again, starting a new registration lifecycle of
   * active / expiry / grace period / etc.
   */
  incrementalDuration: Duration;

  /**
   * Registrant
   *
   * Account that initiated the registrarAction and is paying the "total".
   * It may not be the owner of the name:
   *
   * 1. When a name is registered, the initial owner of the name may be
   *    distinct from the registrant.
   * 2. There are no restrictions on who may renew a name.
   *    Therefore the owner of the name may be distinct from the registrant.
   */
  registrant: Address;

  /**
   * Registration Lifecycle that this "logical" Registrar Action was
   * executed for.
   */
  registrationLifecycle: RegistrationLifecycle;

  /**
   * Pricing information for performing this "logical" Registrar Action.
   */
  pricing: RegistrarActionPricing;

  /**
   * Referral information related to performing this "logical" Registrar Action.
   */
  referral: RegistrarActionReferral;

  /**
   * Block ref
   *
   * References the block where "logical" Registrar Action was executed.
   */
  block: BlockRef;

  /**
   * Transaction hash
   *
   * References the transaction within the `block` where
   * the "logical" Registrar Action was executed.
   */
  transactionHash: Hash;

  /**
   * Event IDs
   *
   * An array of IDs referencing events which while being handled,
   * contributed to the state of the "logical" Registrar Action.
   *
   * Guaranteed to:
   * - Be ordered chronologically by event log index.
   * - Have at least one element.
   * - Reference the same value as `id` with its very first element.
   */
  eventIds: [RegistrarActionEventId, ...RegistrarActionEventId[]];
}
