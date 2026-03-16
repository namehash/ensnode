import type { Duration } from "@ensnode/ensnode-sdk";

import { SECONDS_PER_YEAR } from "../../time";
import type { ReferrerScore } from "../shared/score";

/**
 * Calculate the score of a referrer based on the total incremental duration
 * (in seconds) of registrations and renewals for direct subnames of .eth
 * referred by the referrer within the referral program edition.
 *
 * Used exclusively in the pie-split award model pipeline.
 *
 * @param totalIncrementalDuration - The total incremental duration (in seconds)
 * of referrals made by a referrer within the {@link ReferralProgramRulesPieSplit}.
 */
export const calcReferrerScorePieSplit = (totalIncrementalDuration: Duration): ReferrerScore => {
  return totalIncrementalDuration / SECONDS_PER_YEAR;
};
