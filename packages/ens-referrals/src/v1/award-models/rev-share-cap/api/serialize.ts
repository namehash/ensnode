import { serializePriceEth, serializePriceUsdc } from "@ensnode/ensnode-sdk";

import { ReferrerEditionMetricsTypeIds } from "../../shared/edition-metrics";
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
import type {
  SerializedAggregatedReferrerMetricsRevShareCap,
  SerializedAwardedReferrerMetricsRevShareCap,
  SerializedReferralProgramEditionSummaryRevShareCap,
  SerializedReferralProgramRulesRevShareCap,
  SerializedReferrerEditionMetricsRankedRevShareCap,
  SerializedReferrerEditionMetricsRevShareCap,
  SerializedReferrerEditionMetricsUnrankedRevShareCap,
  SerializedReferrerLeaderboardPageRevShareCap,
  SerializedUnrankedReferrerMetricsRevShareCap,
} from "./serialized-types";

/**
 * Serializes a {@link ReferralProgramRulesRevShareCap} object.
 */
export function serializeReferralProgramRulesRevShareCap(
  rules: ReferralProgramRulesRevShareCap,
): SerializedReferralProgramRulesRevShareCap {
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
 * Serializes a {@link AggregatedReferrerMetricsRevShareCap} object.
 */
export function serializeAggregatedReferrerMetricsRevShareCap(
  metrics: AggregatedReferrerMetricsRevShareCap,
): SerializedAggregatedReferrerMetricsRevShareCap {
  return {
    grandTotalReferrals: metrics.grandTotalReferrals,
    grandTotalIncrementalDuration: metrics.grandTotalIncrementalDuration,
    grandTotalRevenueContribution: serializePriceEth(metrics.grandTotalRevenueContribution),
    awardPoolRemaining: serializePriceUsdc(metrics.awardPoolRemaining),
  };
}

/**
 * Serializes a {@link AwardedReferrerMetricsRevShareCap} object.
 */
export function serializeAwardedReferrerMetricsRevShareCap(
  metrics: AwardedReferrerMetricsRevShareCap,
): SerializedAwardedReferrerMetricsRevShareCap {
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
 * Serializes a {@link UnrankedReferrerMetricsRevShareCap} object.
 */
export function serializeUnrankedReferrerMetricsRevShareCap(
  metrics: UnrankedReferrerMetricsRevShareCap,
): SerializedUnrankedReferrerMetricsRevShareCap {
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
 * Serializes a {@link ReferrerEditionMetricsRankedRevShareCap} object.
 */
export function serializeReferrerEditionMetricsRankedRevShareCap(
  detail: ReferrerEditionMetricsRankedRevShareCap,
): SerializedReferrerEditionMetricsRankedRevShareCap {
  return {
    awardModel: detail.awardModel,
    type: detail.type,
    rules: serializeReferralProgramRulesRevShareCap(detail.rules),
    referrer: serializeAwardedReferrerMetricsRevShareCap(detail.referrer),
    aggregatedMetrics: serializeAggregatedReferrerMetricsRevShareCap(detail.aggregatedMetrics),
    status: detail.status,
    accurateAsOf: detail.accurateAsOf,
  };
}

/**
 * Serializes a {@link ReferrerEditionMetricsUnrankedRevShareCap} object.
 */
export function serializeReferrerEditionMetricsUnrankedRevShareCap(
  detail: ReferrerEditionMetricsUnrankedRevShareCap,
): SerializedReferrerEditionMetricsUnrankedRevShareCap {
  return {
    awardModel: detail.awardModel,
    type: detail.type,
    rules: serializeReferralProgramRulesRevShareCap(detail.rules),
    referrer: serializeUnrankedReferrerMetricsRevShareCap(detail.referrer),
    aggregatedMetrics: serializeAggregatedReferrerMetricsRevShareCap(detail.aggregatedMetrics),
    status: detail.status,
    accurateAsOf: detail.accurateAsOf,
  };
}

/**
 * Serializes a {@link ReferrerEditionMetricsRevShareCap} object (ranked or unranked).
 */
export function serializeReferrerEditionMetricsRevShareCap(
  detail: ReferrerEditionMetricsRevShareCap,
): SerializedReferrerEditionMetricsRevShareCap {
  switch (detail.type) {
    case ReferrerEditionMetricsTypeIds.Ranked:
      return serializeReferrerEditionMetricsRankedRevShareCap(detail);
    case ReferrerEditionMetricsTypeIds.Unranked:
      return serializeReferrerEditionMetricsUnrankedRevShareCap(detail);
    default: {
      const _exhaustiveCheck: never = detail;
      throw new Error(
        `Unknown type: ${(_exhaustiveCheck as ReferrerEditionMetricsRevShareCap).type}`,
      );
    }
  }
}

/**
 * Serializes a {@link ReferrerLeaderboardPageRevShareCap} object.
 */
export function serializeReferrerLeaderboardPageRevShareCap(
  page: ReferrerLeaderboardPageRevShareCap,
): SerializedReferrerLeaderboardPageRevShareCap {
  return {
    awardModel: page.awardModel,
    rules: serializeReferralProgramRulesRevShareCap(page.rules),
    referrers: page.referrers.map(serializeAwardedReferrerMetricsRevShareCap),
    aggregatedMetrics: serializeAggregatedReferrerMetricsRevShareCap(page.aggregatedMetrics),
    pageContext: page.pageContext,
    status: page.status,
    accurateAsOf: page.accurateAsOf,
  };
}

/**
 * Serializes a {@link ReferralProgramEditionSummaryRevShareCap} object.
 */
export function serializeReferralProgramEditionSummaryRevShareCap(
  summary: ReferralProgramEditionSummaryRevShareCap,
): SerializedReferralProgramEditionSummaryRevShareCap {
  return {
    awardModel: summary.awardModel,
    slug: summary.slug,
    displayName: summary.displayName,
    status: summary.status,
    rules: serializeReferralProgramRulesRevShareCap(summary.rules),
    awardPoolRemaining: serializePriceUsdc(summary.awardPoolRemaining),
  };
}
