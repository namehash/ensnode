import { serializePriceEth, serializePriceUsdc } from "@ensnode/ensnode-sdk";

import type { AggregatedReferrerMetricsPieSplit } from "../aggregations";
import type {
  ReferrerEditionMetricsRankedPieSplit,
  ReferrerEditionMetricsUnrankedPieSplit,
} from "../edition-metrics";
import type { ReferrerLeaderboardPagePieSplit } from "../leaderboard-page";
import type { AwardedReferrerMetricsPieSplit, UnrankedReferrerMetricsPieSplit } from "../metrics";
import type { ReferralProgramRulesPieSplit } from "../rules";
import type {
  SerializedAggregatedReferrerMetricsPieSplit,
  SerializedAwardedReferrerMetricsPieSplit,
  SerializedReferralProgramRulesPieSplit,
  SerializedReferrerEditionMetricsRankedPieSplit,
  SerializedReferrerEditionMetricsUnrankedPieSplit,
  SerializedReferrerLeaderboardPagePieSplit,
  SerializedUnrankedReferrerMetricsPieSplit,
} from "./serialized-types";

/**
 * Serializes a {@link ReferralProgramRulesPieSplit} object.
 */
export function serializeReferralProgramRulesPieSplit(
  rules: ReferralProgramRulesPieSplit,
): SerializedReferralProgramRulesPieSplit {
  return {
    awardModel: rules.awardModel,
    totalAwardPoolValue: serializePriceUsdc(rules.totalAwardPoolValue),
    maxQualifiedReferrers: rules.maxQualifiedReferrers,
    startTime: rules.startTime,
    endTime: rules.endTime,
    subregistryId: rules.subregistryId,
    rulesUrl: rules.rulesUrl.toString(),
  };
}

/**
 * Serializes a {@link AggregatedReferrerMetricsPieSplit} object.
 */
export function serializeAggregatedReferrerMetricsPieSplit(
  metrics: AggregatedReferrerMetricsPieSplit,
): SerializedAggregatedReferrerMetricsPieSplit {
  return {
    grandTotalReferrals: metrics.grandTotalReferrals,
    grandTotalIncrementalDuration: metrics.grandTotalIncrementalDuration,
    grandTotalRevenueContribution: serializePriceEth(metrics.grandTotalRevenueContribution),
    grandTotalQualifiedReferrersFinalScore: metrics.grandTotalQualifiedReferrersFinalScore,
    minFinalScoreToQualify: metrics.minFinalScoreToQualify,
  };
}

/**
 * Serializes a {@link AwardedReferrerMetricsPieSplit} object.
 */
export function serializeAwardedReferrerMetricsPieSplit(
  metrics: AwardedReferrerMetricsPieSplit,
): SerializedAwardedReferrerMetricsPieSplit {
  return {
    referrer: metrics.referrer,
    totalReferrals: metrics.totalReferrals,
    totalIncrementalDuration: metrics.totalIncrementalDuration,
    totalRevenueContribution: serializePriceEth(metrics.totalRevenueContribution),
    score: metrics.score,
    rank: metrics.rank,
    isQualified: metrics.isQualified,
    finalScoreBoost: metrics.finalScoreBoost,
    finalScore: metrics.finalScore,
    awardPoolShare: metrics.awardPoolShare,
    awardPoolApproxValue: serializePriceUsdc(metrics.awardPoolApproxValue),
  };
}

/**
 * Serializes a {@link UnrankedReferrerMetricsPieSplit} object.
 */
export function serializeUnrankedReferrerMetricsPieSplit(
  metrics: UnrankedReferrerMetricsPieSplit,
): SerializedUnrankedReferrerMetricsPieSplit {
  return {
    referrer: metrics.referrer,
    totalReferrals: metrics.totalReferrals,
    totalIncrementalDuration: metrics.totalIncrementalDuration,
    totalRevenueContribution: serializePriceEth(metrics.totalRevenueContribution),
    score: metrics.score,
    rank: metrics.rank,
    isQualified: metrics.isQualified,
    finalScoreBoost: metrics.finalScoreBoost,
    finalScore: metrics.finalScore,
    awardPoolShare: metrics.awardPoolShare,
    awardPoolApproxValue: serializePriceUsdc(metrics.awardPoolApproxValue),
  };
}

/**
 * Serializes a {@link ReferrerEditionMetricsRankedPieSplit} object.
 */
export function serializeReferrerEditionMetricsRankedPieSplit(
  detail: ReferrerEditionMetricsRankedPieSplit,
): SerializedReferrerEditionMetricsRankedPieSplit {
  return {
    type: detail.type,
    rules: serializeReferralProgramRulesPieSplit(detail.rules),
    referrer: serializeAwardedReferrerMetricsPieSplit(detail.referrer),
    aggregatedMetrics: serializeAggregatedReferrerMetricsPieSplit(detail.aggregatedMetrics),
    status: detail.status,
    accurateAsOf: detail.accurateAsOf,
  };
}

/**
 * Serializes a {@link ReferrerEditionMetricsUnrankedPieSplit} object.
 */
export function serializeReferrerEditionMetricsUnrankedPieSplit(
  detail: ReferrerEditionMetricsUnrankedPieSplit,
): SerializedReferrerEditionMetricsUnrankedPieSplit {
  return {
    type: detail.type,
    rules: serializeReferralProgramRulesPieSplit(detail.rules),
    referrer: serializeUnrankedReferrerMetricsPieSplit(detail.referrer),
    aggregatedMetrics: serializeAggregatedReferrerMetricsPieSplit(detail.aggregatedMetrics),
    status: detail.status,
    accurateAsOf: detail.accurateAsOf,
  };
}

/**
 * Serializes a {@link ReferrerLeaderboardPagePieSplit} object.
 */
export function serializeReferrerLeaderboardPagePieSplit(
  page: ReferrerLeaderboardPagePieSplit,
): SerializedReferrerLeaderboardPagePieSplit {
  return {
    rules: serializeReferralProgramRulesPieSplit(page.rules),
    referrers: page.referrers.map(serializeAwardedReferrerMetricsPieSplit),
    aggregatedMetrics: serializeAggregatedReferrerMetricsPieSplit(page.aggregatedMetrics),
    pageContext: page.pageContext,
    status: page.status,
    accurateAsOf: page.accurateAsOf,
  };
}
