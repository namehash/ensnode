import type { SerializedPriceEth, SerializedPriceUsdc } from "@ensnode/ensnode-sdk";

import type { AggregatedReferrerMetricsRevShareCap } from "../aggregations";
import type {
  ReferrerEditionMetricsRankedRevShareCap,
  ReferrerEditionMetricsRevShareCap,
  ReferrerEditionMetricsUnrankedRevShareCap,
} from "../edition-metrics";
import type { ReferralProgramEditionSummaryRevShareCap } from "../edition-summary";
import type { ReferrerLeaderboardPageRevShareCap } from "../leaderboard-page";
import type {
  AwardedReferrerMetricsRevShareCap,
  UnrankedReferrerMetricsRevShareCap,
} from "../metrics";
import type { ReferralProgramRulesRevShareCap } from "../rules";

/**
 * Serialized representation of {@link ReferralProgramRulesRevShareCap}.
 */
export interface SerializedReferralProgramRulesRevShareCap
  extends Omit<
    ReferralProgramRulesRevShareCap,
    "awardPool" | "minBaseRevenueContribution" | "baseAnnualRevenueContribution" | "rulesUrl"
  > {
  awardPool: SerializedPriceUsdc;
  minBaseRevenueContribution: SerializedPriceUsdc;
  baseAnnualRevenueContribution: SerializedPriceUsdc;
  rulesUrl: string;
}

/**
 * Serialized representation of {@link AggregatedReferrerMetricsRevShareCap}.
 */
export interface SerializedAggregatedReferrerMetricsRevShareCap
  extends Omit<
    AggregatedReferrerMetricsRevShareCap,
    "grandTotalRevenueContribution" | "awardPoolRemaining"
  > {
  grandTotalRevenueContribution: SerializedPriceEth;
  awardPoolRemaining: SerializedPriceUsdc;
}

/**
 * Serialized representation of {@link AwardedReferrerMetricsRevShareCap}.
 */
export interface SerializedAwardedReferrerMetricsRevShareCap
  extends Omit<
    AwardedReferrerMetricsRevShareCap,
    "totalRevenueContribution" | "totalBaseRevenueContribution" | "uncappedAward" | "cappedAward"
  > {
  totalRevenueContribution: SerializedPriceEth;
  totalBaseRevenueContribution: SerializedPriceUsdc;
  uncappedAward: SerializedPriceUsdc;
  cappedAward: SerializedPriceUsdc;
}

/**
 * Serialized representation of {@link UnrankedReferrerMetricsRevShareCap}.
 */
export interface SerializedUnrankedReferrerMetricsRevShareCap
  extends Omit<
    UnrankedReferrerMetricsRevShareCap,
    "totalRevenueContribution" | "totalBaseRevenueContribution" | "uncappedAward" | "cappedAward"
  > {
  totalRevenueContribution: SerializedPriceEth;
  totalBaseRevenueContribution: SerializedPriceUsdc;
  uncappedAward: SerializedPriceUsdc;
  cappedAward: SerializedPriceUsdc;
}

/**
 * Serialized representation of {@link ReferrerLeaderboardPageRevShareCap}.
 */
export interface SerializedReferrerLeaderboardPageRevShareCap
  extends Omit<ReferrerLeaderboardPageRevShareCap, "rules" | "referrers" | "aggregatedMetrics"> {
  rules: SerializedReferralProgramRulesRevShareCap;
  referrers: SerializedAwardedReferrerMetricsRevShareCap[];
  aggregatedMetrics: SerializedAggregatedReferrerMetricsRevShareCap;
}

/**
 * Serialized representation of {@link ReferrerEditionMetricsRankedRevShareCap}.
 */
export interface SerializedReferrerEditionMetricsRankedRevShareCap
  extends Omit<
    ReferrerEditionMetricsRankedRevShareCap,
    "rules" | "referrer" | "aggregatedMetrics"
  > {
  rules: SerializedReferralProgramRulesRevShareCap;
  referrer: SerializedAwardedReferrerMetricsRevShareCap;
  aggregatedMetrics: SerializedAggregatedReferrerMetricsRevShareCap;
}

/**
 * Serialized representation of {@link ReferrerEditionMetricsUnrankedRevShareCap}.
 */
export interface SerializedReferrerEditionMetricsUnrankedRevShareCap
  extends Omit<
    ReferrerEditionMetricsUnrankedRevShareCap,
    "rules" | "referrer" | "aggregatedMetrics"
  > {
  rules: SerializedReferralProgramRulesRevShareCap;
  referrer: SerializedUnrankedReferrerMetricsRevShareCap;
  aggregatedMetrics: SerializedAggregatedReferrerMetricsRevShareCap;
}

/**
 * Serialized representation of {@link ReferrerEditionMetricsRevShareCap}.
 */
export type SerializedReferrerEditionMetricsRevShareCap =
  | SerializedReferrerEditionMetricsRankedRevShareCap
  | SerializedReferrerEditionMetricsUnrankedRevShareCap;

/**
 * Serialized representation of {@link ReferralProgramEditionSummaryRevShareCap}.
 */
export interface SerializedReferralProgramEditionSummaryRevShareCap
  extends Omit<ReferralProgramEditionSummaryRevShareCap, "rules" | "awardPoolRemaining"> {
  rules: SerializedReferralProgramRulesRevShareCap;
  awardPoolRemaining: SerializedPriceUsdc;
}
