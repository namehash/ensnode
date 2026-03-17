import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import type { AggregatedReferrerMetricsRevShareLimit } from "./award-models/rev-share-limit/aggregations";
import type { ReferralProgramRulesRevShareLimit } from "./award-models/rev-share-limit/rules";
import type { BaseReferralProgramRules } from "./award-models/shared/rules";

/**
 * The type of referral program's status.
 */
export const ReferralProgramStatuses = {
  /**
   * Represents a referral program that has been announced, but hasn't started yet.
   */
  Scheduled: "Scheduled",

  /**
   * Represents a currently ongoing referral program.
   */
  Active: "Active",

  /**
   * Represents a rev-share-limit referral program that is still within its active window
   * but whose award pool has been fully consumed by sequential race processing.
   *
   * Only applicable to `rev-share-limit` editions. Use {@link calcReferralProgramStatusRevShareLimit}
   * to compute a status that may return `Exhausted`.
   */
  Exhausted: "Exhausted",

  /**
   * Represents a referral program that has passed its end time but whose awards have not yet
   * been distributed. The program is in a review window before full closure.
   *
   * Transitions to {@link ReferralProgramStatuses.Closed} once `areAwardsDistributed` is set to `true`.
   */
  AwardsReview: "AwardsReview",

  /**
   * Represents a referral program that has already ended and whose awards have been distributed.
   */
  Closed: "Closed",
} as const;

/**
 * The derived string union of possible {@link ReferralProgramStatuses}.
 */
export type ReferralProgramStatusId =
  (typeof ReferralProgramStatuses)[keyof typeof ReferralProgramStatuses];

/**
 * Calculate the status of the referral program based on the current date
 * and program's timeframe available in its rules.
 *
 * Returns one of `Scheduled`, `Active`, `AwardsReview`, or `Closed`.
 * Never returns `Exhausted` — use {@link calcReferralProgramStatusRevShareLimit} for that.
 *
 * @param rules - Related referral program's rules containing program's start/end date and
 *   `areAwardsDistributed` flag.
 * @param now - Current date in {@link UnixTimestamp} format.
 */
export const calcReferralProgramStatus = (
  rules: BaseReferralProgramRules,
  now: UnixTimestamp,
): ReferralProgramStatusId => {
  // if the program has not started return "Scheduled"
  if (now < rules.startTime) return ReferralProgramStatuses.Scheduled;

  // if the program has ended, return "Closed" if awards are distributed, else "AwardsReview"
  if (now > rules.endTime)
    return rules.areAwardsDistributed
      ? ReferralProgramStatuses.Closed
      : ReferralProgramStatuses.AwardsReview;

  // otherwise, return "Active"
  return ReferralProgramStatuses.Active;
};

/**
 * Calculate the status of a `rev-share-limit` referral program, adding the `Exhausted` state
 * on top of the base status logic.
 *
 * Returns `Exhausted` when the program is `Active` but its award pool has been fully consumed
 * (`awardPoolRemaining.amount === 0n`). Otherwise delegates to {@link calcReferralProgramStatus}.
 *
 * @param rules - The rev-share-limit rules for the edition.
 * @param now - Current date in {@link UnixTimestamp} format.
 * @param aggregatedMetrics - The aggregated leaderboard metrics, used to check `awardPoolRemaining`.
 */
export const calcReferralProgramStatusRevShareLimit = (
  rules: ReferralProgramRulesRevShareLimit,
  now: UnixTimestamp,
  aggregatedMetrics: AggregatedReferrerMetricsRevShareLimit,
): ReferralProgramStatusId => {
  const base = calcReferralProgramStatus(rules, now);
  if (
    base === ReferralProgramStatuses.Active &&
    aggregatedMetrics.awardPoolRemaining.amount === 0n
  ) {
    return ReferralProgramStatuses.Exhausted;
  }
  return base;
};
