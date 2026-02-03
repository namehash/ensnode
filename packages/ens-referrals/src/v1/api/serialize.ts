import { serializePriceEth, serializePriceUsdc } from "@ensnode/ensnode-sdk";

import type { AggregatedReferrerMetrics } from "../aggregations";
import type { ReferralProgramCycle, ReferralProgramCycleId } from "../cycle";
import type { ReferrerLeaderboardPage } from "../leaderboard-page";
import type {
  ReferrerDetail,
  ReferrerDetailRanked,
  ReferrerDetailUnranked,
} from "../referrer-detail";
import type { AwardedReferrerMetrics, UnrankedReferrerMetrics } from "../referrer-metrics";
import type { ReferralProgramRules } from "../rules";
import type {
  SerializedAggregatedReferrerMetrics,
  SerializedAwardedReferrerMetrics,
  SerializedReferralProgramCycle,
  SerializedReferralProgramRules,
  SerializedReferrerDetail,
  SerializedReferrerDetailAllCyclesData,
  SerializedReferrerDetailAllCyclesResponse,
  SerializedReferrerDetailRanked,
  SerializedReferrerDetailUnranked,
  SerializedReferrerLeaderboardPage,
  SerializedReferrerLeaderboardPageResponse,
  SerializedUnrankedReferrerMetrics,
} from "./serialized-types";
import {
  type ReferrerDetailAllCyclesResponse,
  ReferrerDetailAllCyclesResponseCodes,
  type ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseCodes,
} from "./types";

/**
 * Serializes a {@link ReferralProgramRules} object.
 */
export function serializeReferralProgramRules(
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
 * Serializes a {@link ReferrerDetail} object (ranked or unranked).
 */
function serializeReferrerDetail(detail: ReferrerDetail): SerializedReferrerDetail {
  switch (detail.type) {
    case "ranked":
      return serializeReferrerDetailRanked(detail);
    case "unranked":
      return serializeReferrerDetailUnranked(detail);
  }
}

/**
 * Serializes a {@link ReferralProgramCycle} object.
 */
export function serializeReferralProgramCycle(
  cycle: ReferralProgramCycle,
): SerializedReferralProgramCycle {
  return {
    id: cycle.id,
    displayName: cycle.displayName,
    rules: serializeReferralProgramRules(cycle.rules),
    rulesUrl: cycle.rulesUrl,
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
 * Serialize a {@link ReferrerDetailAllCyclesResponse} object.
 */
export function serializeReferrerDetailAllCyclesResponse(
  response: ReferrerDetailAllCyclesResponse,
): SerializedReferrerDetailAllCyclesResponse {
  switch (response.responseCode) {
    case ReferrerDetailAllCyclesResponseCodes.Ok: {
      const serializedData: SerializedReferrerDetailAllCyclesData =
        {} as SerializedReferrerDetailAllCyclesData;

      for (const [cycleId, detail] of Object.entries(response.data)) {
        serializedData[cycleId as ReferralProgramCycleId] = serializeReferrerDetail(detail);
      }

      return {
        responseCode: response.responseCode,
        data: serializedData,
      };
    }

    case ReferrerDetailAllCyclesResponseCodes.Error:
      return response;
  }
}
