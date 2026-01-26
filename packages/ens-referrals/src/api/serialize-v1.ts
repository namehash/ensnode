import { serializePriceEth, serializePriceUsdc } from "@ensnode/ensnode-sdk";

import type { AggregatedReferrerMetrics } from "../aggregations-v1";
import type { ReferrerLeaderboardPage } from "../leaderboard-page-v1";
import type { ReferrerDetailRanked, ReferrerDetailUnranked } from "../referrer-detail-v1";
import type { AwardedReferrerMetrics, UnrankedReferrerMetrics } from "../referrer-metrics-v1";
import type { ReferralProgramRules } from "../rules-v1";
import type {
  SerializedAggregatedReferrerMetrics,
  SerializedAwardedReferrerMetrics,
  SerializedReferralProgramRules,
  SerializedReferrerDetailRanked,
  SerializedReferrerDetailResponse,
  SerializedReferrerDetailUnranked,
  SerializedReferrerLeaderboardPage,
  SerializedReferrerLeaderboardPageResponse,
  SerializedUnrankedReferrerMetrics,
} from "./serialized-types-v1";
import {
  type ReferrerDetailResponse,
  ReferrerDetailResponseCodes,
  type ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseCodes,
} from "./types-v1";

/**
 * Serializes a {@link ReferralProgramRules} object.
 */
function serializeReferralProgramRules(
  rules: ReferralProgramRules,
): SerializedReferralProgramRules {
  return {
    totalAwardPoolValue: serializePriceUsdc(rules.totalAwardPoolValue),
    maxQualifiedReferrers: rules.maxQualifiedReferrers,
    startTime: rules.startTime,
    endTime: rules.endTime,
    subregistryId: rules.subregistryId,
  };
}

/**
 * Serializes an {@link AwardedReferrerMetrics} object.
 */
function serializeAwardedReferrerMetrics(
  metrics: AwardedReferrerMetrics,
): SerializedAwardedReferrerMetrics {
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
 * Serializes an {@link UnrankedReferrerMetrics} object.
 */
function serializeUnrankedReferrerMetrics(
  metrics: UnrankedReferrerMetrics,
): SerializedUnrankedReferrerMetrics {
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
 * Serializes an {@link AggregatedReferrerMetrics} object.
 */
function serializeAggregatedReferrerMetrics(
  metrics: AggregatedReferrerMetrics,
): SerializedAggregatedReferrerMetrics {
  return {
    grandTotalReferrals: metrics.grandTotalReferrals,
    grandTotalIncrementalDuration: metrics.grandTotalIncrementalDuration,
    grandTotalRevenueContribution: serializePriceEth(metrics.grandTotalRevenueContribution),
    grandTotalQualifiedReferrersFinalScore: metrics.grandTotalQualifiedReferrersFinalScore,
    minFinalScoreToQualify: metrics.minFinalScoreToQualify,
  };
}

/**
 * Serializes a {@link ReferrerLeaderboardPage} object.
 */
function serializeReferrerLeaderboardPage(
  page: ReferrerLeaderboardPage,
): SerializedReferrerLeaderboardPage {
  return {
    rules: serializeReferralProgramRules(page.rules),
    referrers: page.referrers.map(serializeAwardedReferrerMetrics),
    aggregatedMetrics: serializeAggregatedReferrerMetrics(page.aggregatedMetrics),
    pageContext: page.pageContext,
    accurateAsOf: page.accurateAsOf,
  };
}

/**
 * Serializes a {@link ReferrerDetailRanked} object.
 */
function serializeReferrerDetailRanked(
  detail: ReferrerDetailRanked,
): SerializedReferrerDetailRanked {
  return {
    type: detail.type,
    rules: serializeReferralProgramRules(detail.rules),
    referrer: serializeAwardedReferrerMetrics(detail.referrer),
    aggregatedMetrics: serializeAggregatedReferrerMetrics(detail.aggregatedMetrics),
    accurateAsOf: detail.accurateAsOf,
  };
}

/**
 * Serializes a {@link ReferrerDetailUnranked} object.
 */
function serializeReferrerDetailUnranked(
  detail: ReferrerDetailUnranked,
): SerializedReferrerDetailUnranked {
  return {
    type: detail.type,
    rules: serializeReferralProgramRules(detail.rules),
    referrer: serializeUnrankedReferrerMetrics(detail.referrer),
    aggregatedMetrics: serializeAggregatedReferrerMetrics(detail.aggregatedMetrics),
    accurateAsOf: detail.accurateAsOf,
  };
}

/**
 * Serialize a {@link ReferrerLeaderboardPageResponse} object.
 */
export function serializeReferrerLeaderboardPageResponse(
  response: ReferrerLeaderboardPageResponse,
): SerializedReferrerLeaderboardPageResponse {
  switch (response.responseCode) {
    case ReferrerLeaderboardPageResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        data: serializeReferrerLeaderboardPage(response.data),
      };

    case ReferrerLeaderboardPageResponseCodes.Error:
      return response;
  }
}

/**
 * Serialize a {@link ReferrerDetailResponse} object.
 */
export function serializeReferrerDetailResponse(
  response: ReferrerDetailResponse,
): SerializedReferrerDetailResponse {
  switch (response.responseCode) {
    case ReferrerDetailResponseCodes.Ok:
      switch (response.data.type) {
        case "ranked":
          return {
            responseCode: response.responseCode,
            data: serializeReferrerDetailRanked(response.data),
          };

        case "unranked":
          return {
            responseCode: response.responseCode,
            data: serializeReferrerDetailUnranked(response.data),
          };
      }
      break;

    case ReferrerDetailResponseCodes.Error:
      return response;
  }
}
