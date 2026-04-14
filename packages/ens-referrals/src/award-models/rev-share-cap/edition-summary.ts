import type { PriceUsdc } from "@ensnode/ensnode-sdk";
import { makePriceUsdcSchema } from "@ensnode/ensnode-sdk/internal";

import type { ReferralProgramEditionSlug } from "../../edition";
import type { BaseReferralProgramEditionSummary } from "../shared/edition-summary";
import { validateBaseReferralProgramEditionSummary } from "../shared/edition-summary";
import type { ReferralProgramAwardModels } from "../shared/rules";
import type { ReferrerLeaderboardRevShareCap } from "./leaderboard";
import type { ReferralProgramRulesRevShareCap } from "./rules";
import { validateReferralProgramRulesRevShareCap } from "./rules";
import { calcReferralProgramEditionStatusRevShareCap } from "./status";

/**
 * Edition summary for a `rev-share-cap` referral program edition.
 *
 * Includes `awardPoolRemaining` so consumers can display pool exhaustion state
 * without needing to fetch the full leaderboard.
 */
export interface ReferralProgramEditionSummaryRevShareCap
  extends BaseReferralProgramEditionSummary {
  /**
   * Discriminant — always `"rev-share-cap"`.
   *
   * @invariant Always equals `rules.awardModel` ({@link ReferralProgramAwardModels.RevShareCap}).
   */
  awardModel: typeof ReferralProgramAwardModels.RevShareCap;

  /**
   * The rev-share-cap rules for this edition.
   */
  rules: ReferralProgramRulesRevShareCap;

  /**
   * The remaining award pool after sequential race processing.
   *
   * When `0n`, the edition's status will be {@link ReferralProgramEditionStatuses.Exhausted}
   * if the edition is still within its active window.
   */
  awardPoolRemaining: PriceUsdc;
}

export const validateEditionSummaryRevShareCap = (
  summary: ReferralProgramEditionSummaryRevShareCap,
): void => {
  validateReferralProgramRulesRevShareCap(summary.rules);

  makePriceUsdcSchema("ReferralProgramEditionSummaryRevShareCap.awardPoolRemaining").parse(
    summary.awardPoolRemaining,
  );

  validateBaseReferralProgramEditionSummary(summary);
};

/**
 * Build a {@link ReferralProgramEditionSummaryRevShareCap} from a rev-share-cap edition
 * config and the edition's leaderboard.
 */
export function buildEditionSummaryRevShareCap(
  slug: ReferralProgramEditionSlug,
  displayName: string,
  rules: ReferralProgramRulesRevShareCap,
  leaderboard: ReferrerLeaderboardRevShareCap,
): ReferralProgramEditionSummaryRevShareCap {
  const status = calcReferralProgramEditionStatusRevShareCap(
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

  validateEditionSummaryRevShareCap(result);

  return result;
}
