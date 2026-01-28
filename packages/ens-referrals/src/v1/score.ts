import type { Duration } from "@ensnode/ensnode-sdk";

import { SECONDS_PER_YEAR } from "./time";

/**
 * The score of a referrer.
 *
 * @invariant Guaranteed to be a finite non-negative number (>= 0)
 */
export type ReferrerScore = number;

export const isValidReferrerScore = (score: ReferrerScore): boolean => {
  return score >= 0 && Number.isFinite(score);
};

export const validateReferrerScore = (score: ReferrerScore): void => {
  if (!isValidReferrerScore(score)) {
    throw new Error(
      `Invalid referrer score: ${score}. Referrer score must be a finite non-negative number.`,
    );
  }
};

/**
 * Calculate the score of a referrer based on the total incremental duration
 * (in seconds) of registrations and renewals for direct subnames of .eth
 * referrered by the referrer within the ENS Holiday Awards period.
 *
 * @param totalIncrementalDuration - The total incremental duration (in seconds)
 * of referrals made by a referrer within the {@link ReferralProgramRules}.
 * @returns The score of the referrer.
 */
export const calcReferrerScore = (totalIncrementalDuration: Duration): ReferrerScore => {
  return totalIncrementalDuration / SECONDS_PER_YEAR;
};
