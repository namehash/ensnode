import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import {
  calcBaseReferralProgramEditionStatus,
  ReferralProgramEditionStatuses,
  type ReferralProgramEditionStatusId,
} from "../shared/status";
import type { AggregatedReferrerMetricsRevShareLimit } from "./aggregations";
import type { ReferralProgramRulesRevShareLimit } from "./rules";

/**
 * Calculate the status of a `rev-share-limit` referral program.
 *
 * Returns `Exhausted` when the program is `Active` but its award pool has been fully consumed
 * (`awardPoolRemaining.amount === 0n`). Otherwise delegates to {@link calcBaseReferralProgramEditionStatus}.
 *
 * @param rules - The rev-share-limit rules for the edition.
 * @param now - Current date in {@link UnixTimestamp} format.
 * @param aggregatedMetrics - The aggregated leaderboard metrics, used to check `awardPoolRemaining`.
 */
export const calcReferralProgramEditionStatusRevShareLimit = (
  rules: ReferralProgramRulesRevShareLimit,
  now: UnixTimestamp,
  aggregatedMetrics: AggregatedReferrerMetricsRevShareLimit,
): ReferralProgramEditionStatusId => {
  const base = calcBaseReferralProgramEditionStatus(rules, now);
  if (
    base === ReferralProgramEditionStatuses.Active &&
    aggregatedMetrics.awardPoolRemaining.amount === 0n
  ) {
    return ReferralProgramEditionStatuses.Exhausted;
  }
  return base;
};
