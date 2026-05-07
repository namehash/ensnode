import type { UnixTimestamp } from "enssdk";

import type { ReferrerEditionMetricsTypeIds } from "../shared/edition-metrics";
import type { ReferralProgramAwardModels } from "../shared/rules";
import type { ReferralProgramEditionStatusId } from "../shared/status";
import type { AggregatedReferrerMetricsRevShareCap } from "./aggregations";
import type {
  AwardedReferrerMetricsRevShareCap,
  UnrankedReferrerMetricsRevShareCap,
} from "./metrics";
import type { ReferralProgramRulesRevShareCap } from "./rules";

/**
 * Referrer edition metrics data for a specific referrer on a rev-share-cap leaderboard.
 *
 * Includes the referrer's awarded metrics from the leaderboard plus timestamp.
 *
 * @see {@link AwardedReferrerMetricsRevShareCap}
 */
export interface ReferrerEditionMetricsRankedRevShareCap {
  /**
   * Discriminant identifying this as data from a rev-share-cap leaderboard edition.
   *
   * @invariant Always equals `rules.awardModel` ({@link ReferralProgramAwardModels.RevShareCap}).
   */
  awardModel: typeof ReferralProgramAwardModels.RevShareCap;

  /**
   * The type of referrer edition metrics data.
   */
  type: typeof ReferrerEditionMetricsTypeIds.Ranked;

  /**
   * The {@link ReferralProgramRulesRevShareCap} used to calculate the {@link AwardedReferrerMetricsRevShareCap}.
   */
  rules: ReferralProgramRulesRevShareCap;

  /**
   * The awarded referrer metrics from the leaderboard.
   *
   * Contains all calculated metrics including rank, qualification status,
   * uncapped award, and capped award.
   */
  referrer: AwardedReferrerMetricsRevShareCap;

  /**
   * Aggregated metrics for all referrers on the leaderboard.
   */
  aggregatedMetrics: AggregatedReferrerMetricsRevShareCap;

  /**
   * The status of the referral program edition
   * calculated based on the program's timing relative to {@link accurateAsOf}.
   */
  status: ReferralProgramEditionStatusId;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link ReferrerEditionMetricsRankedRevShareCap} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}

/**
 * Referrer edition metrics data for a specific referrer address NOT on the rev-share-cap leaderboard.
 *
 * Includes the referrer's unranked metrics (with null rank and isQualified: false) plus timestamp.
 *
 * @see {@link UnrankedReferrerMetricsRevShareCap}
 */
export interface ReferrerEditionMetricsUnrankedRevShareCap {
  /**
   * Discriminant identifying this as data from a rev-share-cap leaderboard edition.
   *
   * @invariant Always equals `rules.awardModel` ({@link ReferralProgramAwardModels.RevShareCap}).
   */
  awardModel: typeof ReferralProgramAwardModels.RevShareCap;

  /**
   * The type of referrer edition metrics data.
   */
  type: typeof ReferrerEditionMetricsTypeIds.Unranked;

  /**
   * The {@link ReferralProgramRulesRevShareCap} used to calculate the {@link UnrankedReferrerMetricsRevShareCap}.
   */
  rules: ReferralProgramRulesRevShareCap;

  /**
   * The unranked referrer metrics (not on the leaderboard).
   *
   * Contains all calculated metrics with rank set to null and isQualified set to false.
   */
  referrer: UnrankedReferrerMetricsRevShareCap;

  /**
   * Aggregated metrics for all referrers on the leaderboard.
   */
  aggregatedMetrics: AggregatedReferrerMetricsRevShareCap;

  /**
   * The status of the referral program edition
   * calculated based on the program's timing relative to {@link accurateAsOf}.
   */
  status: ReferralProgramEditionStatusId;

  /**
   * The {@link UnixTimestamp} of when the data used to build the {@link ReferrerEditionMetricsUnrankedRevShareCap} was accurate as of.
   */
  accurateAsOf: UnixTimestamp;
}

/**
 * All referrer edition metrics variants for the rev-share-cap award model.
 *
 * Use `type` to determine if the referrer is ranked or unranked.
 */
export type ReferrerEditionMetricsRevShareCap =
  | ReferrerEditionMetricsRankedRevShareCap
  | ReferrerEditionMetricsUnrankedRevShareCap;
