import { serializePriceEth, serializePriceUsdc } from "@ensnode/ensnode-sdk";

import type { AggregatedReferrerMetrics } from "../aggregations";
import type { ReferralProgramEditionConfig } from "../edition";
import type {
  ReferrerEditionMetrics,
  ReferrerEditionMetricsRanked,
  ReferrerEditionMetricsUnranked,
} from "../edition-metrics";
import type { ReferrerLeaderboardPage } from "../leaderboard-page";
import type { AwardedReferrerMetrics, UnrankedReferrerMetrics } from "../referrer-metrics";
import type { ReferralProgramRules } from "../rules";
import type {
  SerializedAggregatedReferrerMetrics,
  SerializedAwardedReferrerMetrics,
  SerializedReferralProgramEditionConfig,
  SerializedReferralProgramEditionConfigSetResponse,
  SerializedReferralProgramRules,
  SerializedReferrerEditionMetrics,
  SerializedReferrerEditionMetricsRanked,
  SerializedReferrerEditionMetricsUnranked,
  SerializedReferrerLeaderboardPage,
  SerializedReferrerLeaderboardPageResponse,
  SerializedReferrerMetricsEditionsData,
  SerializedReferrerMetricsEditionsResponse,
  SerializedUnrankedReferrerMetrics,
} from "./serialized-types";
import {
  type ReferralProgramEditionConfigSetResponse,
  ReferralProgramEditionConfigSetResponseCodes,
  type ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseCodes,
  type ReferrerMetricsEditionsResponse,
  ReferrerMetricsEditionsResponseCodes,
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
    rulesUrl: rules.rulesUrl.toString(),
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
 * Serializes a {@link ReferrerEditionMetricsRanked} object.
 */
function serializeReferrerEditionMetricsRanked(
  detail: ReferrerEditionMetricsRanked,
): SerializedReferrerEditionMetricsRanked {
  return {
    type: detail.type,
    rules: serializeReferralProgramRules(detail.rules),
    referrer: serializeAwardedReferrerMetrics(detail.referrer),
    aggregatedMetrics: serializeAggregatedReferrerMetrics(detail.aggregatedMetrics),
    accurateAsOf: detail.accurateAsOf,
  };
}

/**
 * Serializes a {@link ReferrerEditionMetricsUnranked} object.
 */
function serializeReferrerEditionMetricsUnranked(
  detail: ReferrerEditionMetricsUnranked,
): SerializedReferrerEditionMetricsUnranked {
  return {
    type: detail.type,
    rules: serializeReferralProgramRules(detail.rules),
    referrer: serializeUnrankedReferrerMetrics(detail.referrer),
    aggregatedMetrics: serializeAggregatedReferrerMetrics(detail.aggregatedMetrics),
    accurateAsOf: detail.accurateAsOf,
  };
}

/**
 * Serializes a {@link ReferrerEditionMetrics} object (ranked or unranked).
 */
function serializeReferrerEditionMetrics(
  detail: ReferrerEditionMetrics,
): SerializedReferrerEditionMetrics {
  switch (detail.type) {
    case "ranked":
      return serializeReferrerEditionMetricsRanked(detail);
    case "unranked":
      return serializeReferrerEditionMetricsUnranked(detail);
    default: {
      const _exhaustiveCheck: never = detail;
      throw new Error(`Unknown detail type: ${(_exhaustiveCheck as ReferrerEditionMetrics).type}`);
    }
  }
}

/**
 * Serializes a {@link ReferralProgramEditionConfig} object.
 */
export function serializeReferralProgramEditionConfig(
  editionConfig: ReferralProgramEditionConfig,
): SerializedReferralProgramEditionConfig {
  return {
    slug: editionConfig.slug,
    displayName: editionConfig.displayName,
    rules: serializeReferralProgramRules(editionConfig.rules),
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
 * Serialize a {@link ReferrerMetricsEditionsResponse} object.
 */
export function serializeReferrerMetricsEditionsResponse(
  response: ReferrerMetricsEditionsResponse,
): SerializedReferrerMetricsEditionsResponse {
  switch (response.responseCode) {
    case ReferrerMetricsEditionsResponseCodes.Ok: {
      const serializedData = Object.fromEntries(
        Object.entries(response.data).map(([editionSlug, detail]) => [
          editionSlug,
          serializeReferrerEditionMetrics(detail as ReferrerEditionMetrics),
        ]),
      ) as SerializedReferrerMetricsEditionsData;

      return {
        responseCode: response.responseCode,
        data: serializedData,
      };
    }

    case ReferrerMetricsEditionsResponseCodes.Error:
      return response;

    default: {
      const _exhaustiveCheck: never = response;
      throw new Error(
        `Unknown response code: ${(_exhaustiveCheck as ReferrerMetricsEditionsResponse).responseCode}`,
      );
    }
  }
}

/**
 * Serialize a {@link ReferralProgramEditionConfigSetResponse} object.
 */
export function serializeReferralProgramEditionConfigSetResponse(
  response: ReferralProgramEditionConfigSetResponse,
): SerializedReferralProgramEditionConfigSetResponse {
  switch (response.responseCode) {
    case ReferralProgramEditionConfigSetResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        data: {
          editions: response.data.editions.map(serializeReferralProgramEditionConfig),
        },
      };

    case ReferralProgramEditionConfigSetResponseCodes.Error:
      return response;

    default: {
      const _exhaustiveCheck: never = response;
      throw new Error(
        `Unknown response code: ${(_exhaustiveCheck as ReferralProgramEditionConfigSetResponse).responseCode}`,
      );
    }
  }
}
