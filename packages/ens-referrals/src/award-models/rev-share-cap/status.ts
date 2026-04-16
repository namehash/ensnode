import type { UnixTimestamp } from "enssdk";

import {
  calcBaseReferralProgramEditionStatus,
  ReferralProgramEditionStatuses,
  type ReferralProgramEditionStatusId,
} from "../shared/status";
import type { AggregatedReferrerMetricsRevShareCap } from "./aggregations";
import type { ReferralProgramRulesRevShareCap } from "./rules";

/**
 * Calculate the status of a `rev-share-cap` referral program.
 *
 * Returns `Exhausted` when the program is `Active` but its award pool has been fully consumed
 * (`awardPoolRemaining.amount === 0n`). Otherwise delegates to {@link calcBaseReferralProgramEditionStatus}.
 *
 * @param rules - The rev-share-cap rules for the edition.
 * @param now - Current date in {@link UnixTimestamp} format.
 * @param aggregatedMetrics - The aggregated leaderboard metrics, used to check `awardPoolRemaining`.
 */
export const calcReferralProgramEditionStatusRevShareCap = (
  rules: ReferralProgramRulesRevShareCap,
  now: UnixTimestamp,
  aggregatedMetrics: AggregatedReferrerMetricsRevShareCap,
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
