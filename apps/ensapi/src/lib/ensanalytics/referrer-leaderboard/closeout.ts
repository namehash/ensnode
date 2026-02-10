import type { ReferralProgramRules } from "@namehash/ens-referrals/v1";
import { minutesToSeconds } from "date-fns";

import { type Duration, durationBetween, type UnixTimestamp } from "@ensnode/ensnode-sdk";

/**
 * Duration after which we assume a closed edition is safe from chain reorganizations.
 *
 * This is a heuristic value (10 minutes) chosen to provide a reasonable safety margin
 * beyond typical Ethereum finality. It is not a guarantee of immutability.
 */
export const ASSUMED_CHAIN_REORG_SAFE_DURATION: Duration = minutesToSeconds(10);

/**
 * Assumes a referral program edition is immutably closed if it ended more than
 * ASSUMED_CHAIN_REORG_SAFE_DURATION ago.
 *
 * This is a practical heuristic for determining when edition data can be cached
 * indefinitely, based on the assumption that chain reorgs become extremely unlikely
 * after the safety window has passed.
 *
 * @param rules - The referral program rules containing endTime
 * @param referenceTime - The timestamp to check against (typically accurateAsOf from cached leaderboard)
 * @returns true if we assume the edition is immutably closed
 */
export function assumeReferralProgramEditionImmutablyClosed(
  rules: ReferralProgramRules,
  referenceTime: UnixTimestamp,
): boolean {
  const timeSinceClose = durationBetween(rules.endTime, referenceTime);
  return timeSinceClose > ASSUMED_CHAIN_REORG_SAFE_DURATION;
}
