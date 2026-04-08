import type { SerializedPriceEth, SerializedPriceUsdc } from "@ensnode/ensnode-sdk";

import type { AggregatedReferrerMetricsRevShareLimit } from "../aggregations";
import type {
  ReferrerEditionMetricsRankedRevShareLimit,
  ReferrerEditionMetricsRevShareLimit,
  ReferrerEditionMetricsUnrankedRevShareLimit,
} from "../edition-metrics";
import type { ReferralProgramEditionSummaryRevShareLimit } from "../edition-summary";
import type { ReferrerLeaderboardPageRevShareLimit } from "../leaderboard-page";
import type {
  AwardedReferrerMetricsRevShareLimit,
  UnrankedReferrerMetricsRevShareLimit,
} from "../metrics";
import type { ReferralProgramRulesRevShareLimit } from "../rules";

/**
 * Serialized representation of {@link ReferralProgramRulesRevShareLimit}.
 */
export interface SerializedReferralProgramRulesRevShareLimit
  extends Omit<
    ReferralProgramRulesRevShareLimit,
    "awardPool" | "minBaseRevenueContribution" | "baseAnnualRevenueContribution" | "rulesUrl"
  > {
  awardPool: SerializedPriceUsdc;
  minBaseRevenueContribution: SerializedPriceUsdc;
  baseAnnualRevenueContribution: SerializedPriceUsdc;
  rulesUrl: string;
}

/**
 * Serialized representation of {@link AggregatedReferrerMetricsRevShareLimit}.
 */
export interface SerializedAggregatedReferrerMetricsRevShareLimit
  extends Omit<
    AggregatedReferrerMetricsRevShareLimit,
    "grandTotalRevenueContribution" | "awardPoolRemaining"
  > {
  grandTotalRevenueContribution: SerializedPriceEth;
  awardPoolRemaining: SerializedPriceUsdc;
}

/**
 * Serialized representation of {@link AwardedReferrerMetricsRevShareLimit}.
 */
export interface SerializedAwardedReferrerMetricsRevShareLimit
  extends Omit<
    AwardedReferrerMetricsRevShareLimit,
    "totalRevenueContribution" | "totalBaseRevenueContribution" | "uncappedAward" | "cappedAward"
  > {
  totalRevenueContribution: SerializedPriceEth;
  totalBaseRevenueContribution: SerializedPriceUsdc;
  uncappedAward: SerializedPriceUsdc;
  cappedAward: SerializedPriceUsdc;
}

/**
 * Serialized representation of {@link UnrankedReferrerMetricsRevShareLimit}.
 */
export interface SerializedUnrankedReferrerMetricsRevShareLimit
  extends Omit<
    UnrankedReferrerMetricsRevShareLimit,
    "totalRevenueContribution" | "totalBaseRevenueContribution" | "uncappedAward" | "cappedAward"
  > {
  totalRevenueContribution: SerializedPriceEth;
  totalBaseRevenueContribution: SerializedPriceUsdc;
  uncappedAward: SerializedPriceUsdc;
  cappedAward: SerializedPriceUsdc;
}

/**
 * Serialized representation of {@link ReferrerLeaderboardPageRevShareLimit}.
 */
export interface SerializedReferrerLeaderboardPageRevShareLimit
  extends Omit<ReferrerLeaderboardPageRevShareLimit, "rules" | "referrers" | "aggregatedMetrics"> {
  rules: SerializedReferralProgramRulesRevShareLimit;
  referrers: SerializedAwardedReferrerMetricsRevShareLimit[];
  aggregatedMetrics: SerializedAggregatedReferrerMetricsRevShareLimit;
}

/**
 * Serialized representation of {@link ReferrerEditionMetricsRankedRevShareLimit}.
 */
export interface SerializedReferrerEditionMetricsRankedRevShareLimit
  extends Omit<
    ReferrerEditionMetricsRankedRevShareLimit,
    "rules" | "referrer" | "aggregatedMetrics"
  > {
  rules: SerializedReferralProgramRulesRevShareLimit;
  referrer: SerializedAwardedReferrerMetricsRevShareLimit;
  aggregatedMetrics: SerializedAggregatedReferrerMetricsRevShareLimit;
}

/**
 * Serialized representation of {@link ReferrerEditionMetricsUnrankedRevShareLimit}.
 */
export interface SerializedReferrerEditionMetricsUnrankedRevShareLimit
  extends Omit<
    ReferrerEditionMetricsUnrankedRevShareLimit,
    "rules" | "referrer" | "aggregatedMetrics"
  > {
  rules: SerializedReferralProgramRulesRevShareLimit;
  referrer: SerializedUnrankedReferrerMetricsRevShareLimit;
  aggregatedMetrics: SerializedAggregatedReferrerMetricsRevShareLimit;
}

/**
 * Serialized representation of {@link ReferrerEditionMetricsRevShareLimit}.
 */
export type SerializedReferrerEditionMetricsRevShareLimit =
  | SerializedReferrerEditionMetricsRankedRevShareLimit
  | SerializedReferrerEditionMetricsUnrankedRevShareLimit;

/**
 * Serialized representation of {@link ReferralProgramEditionSummaryRevShareLimit}.
 */
export interface SerializedReferralProgramEditionSummaryRevShareLimit
  extends Omit<ReferralProgramEditionSummaryRevShareLimit, "rules" | "awardPoolRemaining"> {
  rules: SerializedReferralProgramRulesRevShareLimit;
  awardPoolRemaining: SerializedPriceUsdc;
}
