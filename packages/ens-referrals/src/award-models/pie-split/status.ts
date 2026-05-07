import type { UnixTimestamp } from "enssdk";

import {
  calcBaseReferralProgramEditionStatus,
  type ReferralProgramEditionStatusId,
} from "../shared/status";
import type { ReferralProgramRulesPieSplit } from "./rules";

/**
 * Calculate the status of a `pie-split` referral program.
 *
 * Delegates entirely to {@link calcBaseReferralProgramEditionStatus} — pie-split has no additional
 * runtime conditions that affect status beyond the time-based lifecycle.
 *
 * @param rules - The pie-split rules for the edition.
 * @param now - Current date in {@link UnixTimestamp} format.
 */
export const calcReferralProgramEditionStatusPieSplit = (
  rules: ReferralProgramRulesPieSplit,
  now: UnixTimestamp,
): ReferralProgramEditionStatusId => calcBaseReferralProgramEditionStatus(rules, now);
