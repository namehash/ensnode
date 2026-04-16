import type { ReferralProgramEditionSlug } from "../../edition";
import type { BaseReferralProgramEditionSummary } from "../shared/edition-summary";
import { validateBaseReferralProgramEditionSummary } from "../shared/edition-summary";
import type { ReferralProgramAwardModels } from "../shared/rules";
import type { ReferrerLeaderboardPieSplit } from "./leaderboard";
import type { ReferralProgramRulesPieSplit } from "./rules";
import { validateReferralProgramRulesPieSplit } from "./rules";
import { calcReferralProgramEditionStatusPieSplit } from "./status";

/**
 * Edition summary for a `pie-split` referral program edition.
 */
export interface ReferralProgramEditionSummaryPieSplit extends BaseReferralProgramEditionSummary {
  /**
   * Discriminant — always `"pie-split"`.
   *
   * @invariant Always equals `rules.awardModel` ({@link ReferralProgramAwardModels.PieSplit}).
   */
  awardModel: typeof ReferralProgramAwardModels.PieSplit;

  /**
   * The pie-split rules for this edition.
   */
  rules: ReferralProgramRulesPieSplit;
}

export const validateEditionSummaryPieSplit = (
  summary: ReferralProgramEditionSummaryPieSplit,
): void => {
  validateReferralProgramRulesPieSplit(summary.rules);
  validateBaseReferralProgramEditionSummary(summary);
};

/**
 * Build a {@link ReferralProgramEditionSummaryPieSplit} from a pie-split edition config and the
 * edition's leaderboard.
 */
export function buildEditionSummaryPieSplit(
  slug: ReferralProgramEditionSlug,
  displayName: string,
  rules: ReferralProgramRulesPieSplit,
  leaderboard: ReferrerLeaderboardPieSplit,
): ReferralProgramEditionSummaryPieSplit {
  const status = calcReferralProgramEditionStatusPieSplit(rules, leaderboard.accurateAsOf);
  const result = { awardModel: rules.awardModel, slug, displayName, status, rules };

  validateEditionSummaryPieSplit(result);

  return result;
}
