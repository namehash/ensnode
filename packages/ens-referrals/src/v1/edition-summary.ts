import {
  buildEditionSummaryPieSplit,
  type ReferralProgramEditionSummaryPieSplit,
} from "./award-models/pie-split/edition-summary";
import {
  buildEditionSummaryRevShareLimit,
  type ReferralProgramEditionSummaryRevShareLimit,
} from "./award-models/rev-share-limit/edition-summary";
import type { ReferralProgramEditionSummaryUnrecognized } from "./award-models/shared/edition-summary";
import { ReferralProgramAwardModels } from "./award-models/shared/rules";
import type { ReferralProgramEditionConfig } from "./edition";
import type { ReferrerLeaderboard } from "./leaderboard";

/**
 * Runtime summary of a referral program edition, enriched with current status and pool data.
 *
 * Use `awardModel` to discriminate between variants at runtime.
 */
export type ReferralProgramEditionSummary =
  | ReferralProgramEditionSummaryPieSplit
  | ReferralProgramEditionSummaryRevShareLimit
  | ReferralProgramEditionSummaryUnrecognized;

/**
 * Build a runtime edition summary from an edition config and the edition's leaderboard.
 * Dispatches to the appropriate per-model builder based on `leaderboard.awardModel`.
 *
 * @param config - The edition configuration (provides `slug` and `displayName`).
 * @param leaderboard - The resolved leaderboard for this edition.
 */
export function buildEditionSummary(
  config: ReferralProgramEditionConfig,
  leaderboard: ReferrerLeaderboard,
): ReferralProgramEditionSummary {
  const { slug, displayName } = config;

  switch (leaderboard.awardModel) {
    case ReferralProgramAwardModels.PieSplit:
      return buildEditionSummaryPieSplit(slug, displayName, leaderboard.rules, leaderboard);

    case ReferralProgramAwardModels.RevShareLimit:
      return buildEditionSummaryRevShareLimit(slug, displayName, leaderboard.rules, leaderboard);

    default: {
      const _exhaustiveCheck: never = leaderboard;
      throw new Error(
        `Unknown award model: ${(_exhaustiveCheck as ReferrerLeaderboard).awardModel}`,
      );
    }
  }
}
