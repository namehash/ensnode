import { serializePriceEth, serializePriceUsdc } from "@ensnode/ensnode-sdk";

import type { AggregatedReferrerMetricsRevShareLimit } from "../aggregations";
import type {
  ReferrerEditionMetricsRankedRevShareLimit,
  ReferrerEditionMetricsUnrankedRevShareLimit,
} from "../edition-metrics";
import type { ReferrerLeaderboardPageRevShareLimit } from "../leaderboard-page";
import type {
  AwardedReferrerMetricsRevShareLimit,
  UnrankedReferrerMetricsRevShareLimit,
} from "../metrics";
import type { ReferralProgramRulesRevShareLimit } from "../rules";
import type {
  SerializedAggregatedReferrerMetricsRevShareLimit,
  SerializedAwardedReferrerMetricsRevShareLimit,
  SerializedReferralProgramRulesRevShareLimit,
  SerializedReferrerEditionMetricsRankedRevShareLimit,
  SerializedReferrerEditionMetricsUnrankedRevShareLimit,
  SerializedReferrerLeaderboardPageRevShareLimit,
  SerializedUnrankedReferrerMetricsRevShareLimit,
} from "./serialized-types";

/**
 * Serializes a {@link ReferralProgramRulesRevShareLimit} object.
 */
export function serializeReferralProgramRulesRevShareLimit(
  rules: ReferralProgramRulesRevShareLimit,
): SerializedReferralProgramRulesRevShareLimit {
  return {
    awardModel: rules.awardModel,
    totalAwardPoolValue: serializePriceUsdc(rules.totalAwardPoolValue),
    minQualifiedRevenueContribution: serializePriceUsdc(rules.minQualifiedRevenueContribution),
    qualifiedRevenueShare: rules.qualifiedRevenueShare,
    startTime: rules.startTime,
    endTime: rules.endTime,
    subregistryId: rules.subregistryId,
    rulesUrl: rules.rulesUrl.toString(),
  };
}

/**
 * Serializes a {@link AggregatedReferrerMetricsRevShareLimit} object.
 */
export function serializeAggregatedReferrerMetricsRevShareLimit(
  metrics: AggregatedReferrerMetricsRevShareLimit,
): SerializedAggregatedReferrerMetricsRevShareLimit {
  return {
    grandTotalReferrals: metrics.grandTotalReferrals,
    grandTotalIncrementalDuration: metrics.grandTotalIncrementalDuration,
    grandTotalRevenueContribution: serializePriceEth(metrics.grandTotalRevenueContribution),
    awardPoolRemaining: serializePriceUsdc(metrics.awardPoolRemaining),
  };
}

/**
 * Serializes a {@link AwardedReferrerMetricsRevShareLimit} object.
 */
export function serializeAwardedReferrerMetricsRevShareLimit(
  metrics: AwardedReferrerMetricsRevShareLimit,
): SerializedAwardedReferrerMetricsRevShareLimit {
  return {
    referrer: metrics.referrer,
    totalReferrals: metrics.totalReferrals,
    totalIncrementalDuration: metrics.totalIncrementalDuration,
    totalRevenueContribution: serializePriceEth(metrics.totalRevenueContribution),
    totalBaseRevenueContribution: serializePriceUsdc(metrics.totalBaseRevenueContribution),
    rank: metrics.rank,
    isQualified: metrics.isQualified,
    awardPoolApproxValue: serializePriceUsdc(metrics.awardPoolApproxValue),
  };
}

/**
 * Serializes a {@link UnrankedReferrerMetricsRevShareLimit} object.
 */
export function serializeUnrankedReferrerMetricsRevShareLimit(
  metrics: UnrankedReferrerMetricsRevShareLimit,
): SerializedUnrankedReferrerMetricsRevShareLimit {
  return {
    referrer: metrics.referrer,
    totalReferrals: metrics.totalReferrals,
    totalIncrementalDuration: metrics.totalIncrementalDuration,
    totalRevenueContribution: serializePriceEth(metrics.totalRevenueContribution),
    totalBaseRevenueContribution: serializePriceUsdc(metrics.totalBaseRevenueContribution),
    rank: metrics.rank,
    isQualified: metrics.isQualified,
    awardPoolApproxValue: serializePriceUsdc(metrics.awardPoolApproxValue),
  };
}

/**
 * Serializes a {@link ReferrerEditionMetricsRankedRevShareLimit} object.
 */
export function serializeReferrerEditionMetricsRankedRevShareLimit(
  detail: ReferrerEditionMetricsRankedRevShareLimit,
): SerializedReferrerEditionMetricsRankedRevShareLimit {
  return {
    awardModel: detail.awardModel,
    type: detail.type,
    rules: serializeReferralProgramRulesRevShareLimit(detail.rules),
    referrer: serializeAwardedReferrerMetricsRevShareLimit(detail.referrer),
    aggregatedMetrics: serializeAggregatedReferrerMetricsRevShareLimit(detail.aggregatedMetrics),
    status: detail.status,
    accurateAsOf: detail.accurateAsOf,
  };
}

/**
 * Serializes a {@link ReferrerEditionMetricsUnrankedRevShareLimit} object.
 */
export function serializeReferrerEditionMetricsUnrankedRevShareLimit(
  detail: ReferrerEditionMetricsUnrankedRevShareLimit,
): SerializedReferrerEditionMetricsUnrankedRevShareLimit {
  return {
    awardModel: detail.awardModel,
    type: detail.type,
    rules: serializeReferralProgramRulesRevShareLimit(detail.rules),
    referrer: serializeUnrankedReferrerMetricsRevShareLimit(detail.referrer),
    aggregatedMetrics: serializeAggregatedReferrerMetricsRevShareLimit(detail.aggregatedMetrics),
    status: detail.status,
    accurateAsOf: detail.accurateAsOf,
  };
}

/**
 * Serializes a {@link ReferrerLeaderboardPageRevShareLimit} object.
 */
export function serializeReferrerLeaderboardPageRevShareLimit(
  page: ReferrerLeaderboardPageRevShareLimit,
): SerializedReferrerLeaderboardPageRevShareLimit {
  return {
    awardModel: page.awardModel,
    rules: serializeReferralProgramRulesRevShareLimit(page.rules),
    referrers: page.referrers.map(serializeAwardedReferrerMetricsRevShareLimit),
    aggregatedMetrics: serializeAggregatedReferrerMetricsRevShareLimit(page.aggregatedMetrics),
    pageContext: page.pageContext,
    status: page.status,
    accurateAsOf: page.accurateAsOf,
  };
}
