import type { UnixTimestamp } from "enssdk";

import type { BaseReferralProgramRules } from "./rules";

/**
 * The type of referral program edition's status.
 */
export const ReferralProgramEditionStatuses = {
  /**
   * Represents a referral program edition that has been announced, but hasn't started yet.
   */
  Scheduled: "Scheduled",

  /**
   * Represents a currently ongoing referral program edition.
   */
  Active: "Active",

  /**
   * Represents a referral program edition that is still within its active window
   * but whose award pool has been fully consumed.
   *
   * @note Not all award models may support this status.
   */
  Exhausted: "Exhausted",

  /**
   * Represents a referral program edition that has passed its end time but whose awards have not yet
   * been distributed. The edition is in a review window before full closure.
   *
   * Transitions to {@link ReferralProgramEditionStatuses.Closed} once `areAwardsDistributed` is set to `true`.
   */
  AwardsReview: "AwardsReview",

  /**
   * Represents a referral program edition that has already ended and whose awards have been distributed.
   */
  Closed: "Closed",
} as const;

/**
 * The derived string union of possible {@link ReferralProgramEditionStatuses}.
 */
export type ReferralProgramEditionStatusId =
  (typeof ReferralProgramEditionStatuses)[keyof typeof ReferralProgramEditionStatuses];

/**
 * Calculate the base status of a referral program edition using only its rules and
 * the current time (makes no consideration of the awards possibly being exhausted).
 *
 * @param rules - Related referral program's rules containing program's start/end date and
 *   `areAwardsDistributed` flag.
 * @param now - Current date in {@link UnixTimestamp} format.
 */
export const calcBaseReferralProgramEditionStatus = (
  rules: BaseReferralProgramRules,
  now: UnixTimestamp,
): ReferralProgramEditionStatusId => {
  // if the program has not started return "Scheduled"
  if (now < rules.startTime) return ReferralProgramEditionStatuses.Scheduled;

  // if the program has ended, return "Closed" if awards are distributed, else "AwardsReview"
  if (now > rules.endTime)
    return rules.areAwardsDistributed
      ? ReferralProgramEditionStatuses.Closed
      : ReferralProgramEditionStatuses.AwardsReview;

  // otherwise, return "Active"
  return ReferralProgramEditionStatuses.Active;
};
