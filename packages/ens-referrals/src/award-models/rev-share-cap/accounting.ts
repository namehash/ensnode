import type { Address, Duration, InterpretedName, NormalizedAddress, UnixTimestamp } from "enssdk";
import type { Hash } from "viem";

import type { PriceEth, PriceUsdc, RegistrarActionType } from "@ensnode/ensnode-sdk";

/**
 * Per-event accounting math for a single referral under a rev-share-cap edition.
 */
export interface TentativeReferralAwardRevShareCap {
  /**
   * Revenue contribution in ETH from this single referral event.
   */
  incrementalRevenueContribution: PriceEth;

  /**
   * Running total of the referrer's revenue contribution in ETH, through and including this event.
   */
  accumulatedRevenueContribution: PriceEth;

  /**
   * Base revenue contribution in USDC attributable to this single referral event's duration.
   */
  incrementalBaseRevenueContribution: PriceUsdc;

  /**
   * The referrer's accumulated base revenue contribution in USDC, through and including this event.
   */
  accumulatedBaseRevenueContribution: PriceUsdc;

  /**
   * The award pool in USDC remaining.
   *
   * @invariant Reflects the pool state *before* this event was processed.
   */
  awardPoolRemaining: PriceUsdc;

  /**
   * `true` if and only if the referrer has an admin-disqualification action for this edition.
   *
   * @invariant Reflects admin disqualification only; NOT set when the referrer has simply not
   *            yet met the minimum-base-revenue threshold.
   */
  disqualified: boolean;

  /**
   * The admin-disqualification reason string, verbatim from the admin action.
   *
   * @invariant Defined if and only if `disqualified === true`.
   */
  disqualificationReason?: string;

  /**
   * A copy of `rules.maxBaseRevenueShare` at the time of this event.
   */
  maxRevShare: number;

  /**
   * The effective fraction of base revenue that was awarded for this event. Derived as
   * `incrementalTentativeAward.amount / incrementalBaseRevenueContribution.amount`.
   * Useful for diagnosing partial-pool truncation and first-time-qualification catch-up awards.
   *
   * @invariant Equals `0` when `incrementalBaseRevenueContribution.amount === 0n`.
   * @invariant `<= maxRevShare` for the already-qualified branch. May exceed `maxRevShare` on
   *            the event that triggers first-time qualification, because accumulated uncapped
   *            award from prior events is claimed against this event's base revenue.
   */
  effectiveBaseRevShare: number;

  /**
   * The tentative USDC award attributed to this single referral event.
   *
   * On the event that triggers first-time qualification, this includes the accumulated uncapped
   * award from prior events in which the referrer had not yet qualified (capped by the remaining
   * award pool). On subsequent events, it is the per-event uncapped award capped by the pool.
   *
   * @invariant `amount === 0n` when the referrer is admin-disqualified OR has not yet qualified
   *            as of this event. Also zero when the pool is empty.
   * @invariant `amount <= awardPoolRemaining.amount`.
   */
  incrementalTentativeAward: PriceUsdc;
}

/**
 * A single per-event accounting record for a referral under a rev-share-cap edition.
 */
export interface ReferralAccountingRecordRevShareCap {
  /**
   * The registrar-action identifier.
   */
  registrarActionId: string;

  /**
   * Block timestamp of the referral event.
   */
  timestamp: UnixTimestamp;

  /**
   * FQDN of the name the referral applies to.
   */
  name: InterpretedName;

  /**
   * Type of registrar action.
   */
  actionType: RegistrarActionType;

  /**
   * Transaction hash of the referral.
   */
  transactionHash: Hash;

  /**
   * Registrant that paid for / performed the action.
   */
  registrant: Address;

  /**
   * Referrer that received credit.
   */
  referrer: NormalizedAddress;

  /**
   * Incremental duration (seconds) contributed by this referral.
   */
  incrementalDuration: Duration;

  /**
   * Per-event accounting math from the rev-share-cap race.
   */
  tentativeAward: TentativeReferralAwardRevShareCap;
}
