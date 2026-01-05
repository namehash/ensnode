import type { ReferralProgramRules } from "./rules.ts";
import type { UnixTimestamp } from "./time.ts";

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
   * Represents a referral program that has already ended.
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
 * @param referralProgramRules - Related referral program's rules containing
 * program's start date and end date.
 *
 * @param now - Current date in {@link UnixTimestamp} format.
 */
const calcReferralProgramStatus = (
  referralProgramRules: ReferralProgramRules,
  now: UnixTimestamp,
): ReferralProgramStatusId => {
  // if the program has not started return "Scheduled"
  if (now < referralProgramRules.startTime) return ReferralProgramStatuses.Scheduled;

  // if the program has ended return "Closed"
  if (now > referralProgramRules.endTime) return ReferralProgramStatuses.Closed;

  // otherwise, return "Active"
  return ReferralProgramStatuses.Active;
};
