import { serializePriceEth, serializePriceUsdc } from "@ensnode/ensnode-sdk";

import { ReferrerEditionMetricsTypeIds } from "../../shared/edition-metrics";
import type { AggregatedReferrerMetricsPieSplit } from "../aggregations";
import type {
  ReferrerEditionMetricsPieSplit,
  ReferrerEditionMetricsRankedPieSplit,
  ReferrerEditionMetricsUnrankedPieSplit,
} from "../edition-metrics";
import type { ReferralProgramEditionSummaryPieSplit } from "../edition-summary";
import type { ReferrerLeaderboardPagePieSplit } from "../leaderboard-page";
import type { AwardedReferrerMetricsPieSplit, UnrankedReferrerMetricsPieSplit } from "../metrics";
import type { ReferralProgramRulesPieSplit } from "../rules";
import type {
  SerializedAggregatedReferrerMetricsPieSplit,
  SerializedAwardedReferrerMetricsPieSplit,
  SerializedReferralProgramEditionSummaryPieSplit,
  SerializedReferralProgramRulesPieSplit,
  SerializedReferrerEditionMetricsPieSplit,
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
    awardPool: serializePriceUsdc(rules.awardPool),
    maxQualifiedReferrers: rules.maxQualifiedReferrers,
    startTime: rules.startTime,
    endTime: rules.endTime,
    subregistryId: rules.subregistryId,
    rulesUrl: rules.rulesUrl.toString(),
    areAwardsDistributed: rules.areAwardsDistributed,
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
    awardModel: detail.awardModel,
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
    awardModel: detail.awardModel,
    type: detail.type,
    rules: serializeReferralProgramRulesPieSplit(detail.rules),
    referrer: serializeUnrankedReferrerMetricsPieSplit(detail.referrer),
    aggregatedMetrics: serializeAggregatedReferrerMetricsPieSplit(detail.aggregatedMetrics),
    status: detail.status,
    accurateAsOf: detail.accurateAsOf,
  };
}

/**
 * Serializes a {@link ReferrerEditionMetricsPieSplit} object (ranked or unranked).
 */
export function serializeReferrerEditionMetricsPieSplit(
  detail: ReferrerEditionMetricsPieSplit,
): SerializedReferrerEditionMetricsPieSplit {
  switch (detail.type) {
    case ReferrerEditionMetricsTypeIds.Ranked:
      return serializeReferrerEditionMetricsRankedPieSplit(detail);
    case ReferrerEditionMetricsTypeIds.Unranked:
      return serializeReferrerEditionMetricsUnrankedPieSplit(detail);
    default: {
      const _exhaustiveCheck: never = detail;
      throw new Error(`Unknown type: ${(_exhaustiveCheck as ReferrerEditionMetricsPieSplit).type}`);
    }
  }
}

/**
 * Serializes a {@link ReferrerLeaderboardPagePieSplit} object.
 */
export function serializeReferrerLeaderboardPagePieSplit(
  page: ReferrerLeaderboardPagePieSplit,
): SerializedReferrerLeaderboardPagePieSplit {
  return {
    awardModel: page.awardModel,
    rules: serializeReferralProgramRulesPieSplit(page.rules),
    referrers: page.referrers.map(serializeAwardedReferrerMetricsPieSplit),
    aggregatedMetrics: serializeAggregatedReferrerMetricsPieSplit(page.aggregatedMetrics),
    pageContext: page.pageContext,
    status: page.status,
    accurateAsOf: page.accurateAsOf,
  };
}

/**
 * Serializes a {@link ReferralProgramEditionSummaryPieSplit} object.
 */
export function serializeReferralProgramEditionSummaryPieSplit(
  summary: ReferralProgramEditionSummaryPieSplit,
): SerializedReferralProgramEditionSummaryPieSplit {
  return {
    awardModel: summary.awardModel,
    slug: summary.slug,
    displayName: summary.displayName,
    status: summary.status,
    rules: serializeReferralProgramRulesPieSplit(summary.rules),
  };
}
