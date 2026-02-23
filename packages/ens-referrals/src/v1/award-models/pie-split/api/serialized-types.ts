import type { SerializedPriceEth, SerializedPriceUsdc } from "@ensnode/ensnode-sdk";

import type { AggregatedReferrerMetricsPieSplit } from "../aggregations";
import type {
  ReferrerEditionMetricsRankedPieSplit,
  ReferrerEditionMetricsUnrankedPieSplit,
} from "../edition-metrics";
import type { ReferrerLeaderboardPagePieSplit } from "../leaderboard-page";
import type { AwardedReferrerMetricsPieSplit, UnrankedReferrerMetricsPieSplit } from "../metrics";
import type { ReferralProgramRulesPieSplit } from "../rules";

/**
 * Serialized representation of {@link ReferralProgramRulesPieSplit}.
 */
export interface SerializedReferralProgramRulesPieSplit
  extends Omit<ReferralProgramRulesPieSplit, "totalAwardPoolValue" | "rulesUrl"> {
  totalAwardPoolValue: SerializedPriceUsdc;
  rulesUrl: string;
}

/**
 * Serialized representation of {@link AggregatedReferrerMetricsPieSplit}.
 */
export interface SerializedAggregatedReferrerMetricsPieSplit
  extends Omit<AggregatedReferrerMetricsPieSplit, "grandTotalRevenueContribution"> {
  grandTotalRevenueContribution: SerializedPriceEth;
}

/**
 * Serialized representation of {@link AwardedReferrerMetricsPieSplit}.
 */
export interface SerializedAwardedReferrerMetricsPieSplit
  extends Omit<
    AwardedReferrerMetricsPieSplit,
    "totalRevenueContribution" | "awardPoolApproxValue"
  > {
  totalRevenueContribution: SerializedPriceEth;
  awardPoolApproxValue: SerializedPriceUsdc;
}

/**
 * Serialized representation of {@link UnrankedReferrerMetricsPieSplit}.
 */
export interface SerializedUnrankedReferrerMetricsPieSplit
  extends Omit<
    UnrankedReferrerMetricsPieSplit,
    "totalRevenueContribution" | "awardPoolApproxValue"
  > {
  totalRevenueContribution: SerializedPriceEth;
  awardPoolApproxValue: SerializedPriceUsdc;
}

/**
 * Serialized representation of {@link ReferrerLeaderboardPagePieSplit}.
 */
export interface SerializedReferrerLeaderboardPagePieSplit
  extends Omit<ReferrerLeaderboardPagePieSplit, "rules" | "referrers" | "aggregatedMetrics"> {
  rules: SerializedReferralProgramRulesPieSplit;
  referrers: SerializedAwardedReferrerMetricsPieSplit[];
  aggregatedMetrics: SerializedAggregatedReferrerMetricsPieSplit;
}

/**
 * Serialized representation of {@link ReferrerEditionMetricsRankedPieSplit}.
 */
export interface SerializedReferrerEditionMetricsRankedPieSplit
  extends Omit<ReferrerEditionMetricsRankedPieSplit, "rules" | "referrer" | "aggregatedMetrics"> {
  rules: SerializedReferralProgramRulesPieSplit;
  referrer: SerializedAwardedReferrerMetricsPieSplit;
  aggregatedMetrics: SerializedAggregatedReferrerMetricsPieSplit;
}

/**
 * Serialized representation of {@link ReferrerEditionMetricsUnrankedPieSplit}.
 */
export interface SerializedReferrerEditionMetricsUnrankedPieSplit
  extends Omit<ReferrerEditionMetricsUnrankedPieSplit, "rules" | "referrer" | "aggregatedMetrics"> {
  rules: SerializedReferralProgramRulesPieSplit;
  referrer: SerializedUnrankedReferrerMetricsPieSplit;
  aggregatedMetrics: SerializedAggregatedReferrerMetricsPieSplit;
}
