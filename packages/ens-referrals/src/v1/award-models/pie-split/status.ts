import type { UnixTimestamp } from "@ensnode/ensnode-sdk";

import { calcBaseReferralProgramStatus, type ReferralProgramStatusId } from "../shared/status";
import type { ReferralProgramRulesPieSplit } from "./rules";

/**
 * Calculate the status of a `pie-split` referral program.
 *
 * Delegates entirely to {@link calcBaseReferralProgramStatus} — pie-split has no additional
 * runtime conditions that affect status beyond the time-based lifecycle.
 *
 * @param rules - The pie-split rules for the edition.
 * @param now - Current date in {@link UnixTimestamp} format.
 */
export const calcReferralProgramStatusPieSplit = (
  rules: ReferralProgramRulesPieSplit,
  now: UnixTimestamp,
): ReferralProgramStatusId => calcBaseReferralProgramStatus(rules, now);
