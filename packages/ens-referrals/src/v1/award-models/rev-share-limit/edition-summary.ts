import type { PriceUsdc } from "@ensnode/ensnode-sdk";
import { makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import type { ReferralProgramEditionSlug } from "../../edition";
import type { BaseReferralProgramEditionSummary } from "../shared/edition-summary";
import { validateBaseReferralProgramEditionSummary } from "../shared/edition-summary";
import type { ReferralProgramAwardModels } from "../shared/rules";
import type { ReferrerLeaderboardRevShareLimit } from "./leaderboard";
import type { ReferralProgramRulesRevShareLimit } from "./rules";
import { validateReferralProgramRulesRevShareLimit } from "./rules";
import { calcReferralProgramEditionStatusRevShareLimit } from "./status";

/**
 * Edition summary for a `rev-share-limit` referral program edition.
 *
 * Includes `awardPoolRemaining` so consumers can display pool exhaustion state
 * without needing to fetch the full leaderboard.
 */
export interface ReferralProgramEditionSummaryRevShareLimit
  extends BaseReferralProgramEditionSummary {
  /**
   * Discriminant — always `"rev-share-limit"`.
   *
   * @invariant Always equals `rules.awardModel` ({@link ReferralProgramAwardModels.RevShareLimit}).
   */
  awardModel: typeof ReferralProgramAwardModels.RevShareLimit;

  /**
   * The rev-share-limit rules for this edition.
   */
  rules: ReferralProgramRulesRevShareLimit;

  /**
   * The remaining award pool after sequential race processing.
   *
   * When `0n`, the edition's status will be {@link ReferralProgramEditionStatuses.Exhausted}
   * if the edition is still within its active window.
   */
  awardPoolRemaining: PriceUsdc;
}

export const validateEditionSummaryRevShareLimit = (
  summary: ReferralProgramEditionSummaryRevShareLimit,
): void => {
  validateReferralProgramRulesRevShareLimit(summary.rules);

  makePriceUsdcSchema("ReferralProgramEditionSummaryRevShareLimit.awardPoolRemaining").parse(
    summary.awardPoolRemaining,
  );

  validateBaseReferralProgramEditionSummary(summary);
};

/**
 * Build a {@link ReferralProgramEditionSummaryRevShareLimit} from a rev-share-limit edition
 * config and the edition's leaderboard.
 */
export function buildEditionSummaryRevShareLimit(
  slug: ReferralProgramEditionSlug,
  displayName: string,
  rules: ReferralProgramRulesRevShareLimit,
  leaderboard: ReferrerLeaderboardRevShareLimit,
): ReferralProgramEditionSummaryRevShareLimit {
  const status = calcReferralProgramEditionStatusRevShareLimit(
    rules,
    leaderboard.accurateAsOf,
    leaderboard.aggregatedMetrics,
  );
  const result = {
    awardModel: rules.awardModel,
    slug,
    displayName,
    status,
    rules,
    awardPoolRemaining: leaderboard.aggregatedMetrics.awardPoolRemaining,
  };

  validateEditionSummaryRevShareLimit(result);

  return result;
}
