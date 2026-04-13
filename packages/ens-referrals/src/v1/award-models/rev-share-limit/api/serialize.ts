import { serializePriceEth, serializePriceUsdc } from "@ensnode/ensnode-sdk";

import { ReferrerEditionMetricsTypeIds } from "../../shared/edition-metrics";
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
import type {
  SerializedAggregatedReferrerMetricsRevShareLimit,
  SerializedAwardedReferrerMetricsRevShareLimit,
  SerializedReferralProgramEditionSummaryRevShareLimit,
  SerializedReferralProgramRulesRevShareLimit,
  SerializedReferrerEditionMetricsRankedRevShareLimit,
  SerializedReferrerEditionMetricsRevShareLimit,
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
    awardPool: serializePriceUsdc(rules.awardPool),
    minBaseRevenueContribution: serializePriceUsdc(rules.minBaseRevenueContribution),
    baseAnnualRevenueContribution: serializePriceUsdc(rules.baseAnnualRevenueContribution),
    maxBaseRevenueShare: rules.maxBaseRevenueShare,
    startTime: rules.startTime,
    endTime: rules.endTime,
    subregistryId: rules.subregistryId,
    rulesUrl: rules.rulesUrl.toString(),
    areAwardsDistributed: rules.areAwardsDistributed,
    disqualifications: rules.disqualifications,
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
    uncappedAward: serializePriceUsdc(metrics.uncappedAward),
    cappedAward: serializePriceUsdc(metrics.cappedAward),
    isAdminDisqualified: metrics.isAdminDisqualified,
    adminDisqualificationReason: metrics.adminDisqualificationReason,
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
    uncappedAward: serializePriceUsdc(metrics.uncappedAward),
    cappedAward: serializePriceUsdc(metrics.cappedAward),
    isAdminDisqualified: metrics.isAdminDisqualified,
    adminDisqualificationReason: metrics.adminDisqualificationReason,
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
 * Serializes a {@link ReferrerEditionMetricsRevShareLimit} object (ranked or unranked).
 */
export function serializeReferrerEditionMetricsRevShareLimit(
  detail: ReferrerEditionMetricsRevShareLimit,
): SerializedReferrerEditionMetricsRevShareLimit {
  switch (detail.type) {
    case ReferrerEditionMetricsTypeIds.Ranked:
      return serializeReferrerEditionMetricsRankedRevShareLimit(detail);
    case ReferrerEditionMetricsTypeIds.Unranked:
      return serializeReferrerEditionMetricsUnrankedRevShareLimit(detail);
    default: {
      const _exhaustiveCheck: never = detail;
      throw new Error(
        `Unknown type: ${(_exhaustiveCheck as ReferrerEditionMetricsRevShareLimit).type}`,
      );
    }
  }
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

/**
 * Serializes a {@link ReferralProgramEditionSummaryRevShareLimit} object.
 */
export function serializeReferralProgramEditionSummaryRevShareLimit(
  summary: ReferralProgramEditionSummaryRevShareLimit,
): SerializedReferralProgramEditionSummaryRevShareLimit {
  return {
    awardModel: summary.awardModel,
    slug: summary.slug,
    displayName: summary.displayName,
    status: summary.status,
    rules: serializeReferralProgramRulesRevShareLimit(summary.rules),
    awardPoolRemaining: serializePriceUsdc(summary.awardPoolRemaining),
  };
}
