import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import type { BaseReferralProgramRules } from "./rules";

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
   * Represents a referral program that is still within its active window
   * but whose award pool has been fully consumed.
   *
   * @note Not all award models may support this status.
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
 * Calculate the base status of a referral program using only its rules and the current time.
 *
 * @param rules - Related referral program's rules containing program's start/end date and
 *   `areAwardsDistributed` flag.
 * @param now - Current date in {@link UnixTimestamp} format.
 */
export const calcBaseReferralProgramStatus = (
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
