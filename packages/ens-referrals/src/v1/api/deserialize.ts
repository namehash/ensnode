import { prettifyError } from "zod/v4";

import { deserializePriceEth, deserializePriceUsdc, type PriceEth } from "@ensnode/ensnode-sdk";

import type { AggregatedReferrerMetrics } from "../aggregations";
import type { ReferrerLeaderboardPage } from "../leaderboard-page";
import type { ReferrerDetailRanked, ReferrerDetailUnranked } from "../referrer-detail";
import type { AwardedReferrerMetrics, UnrankedReferrerMetrics } from "../referrer-metrics";
import type { ReferralProgramRules } from "../rules";
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
} from "./serialized-types";
import type { ReferrerDetailResponse, ReferrerLeaderboardPageResponse } from "./types";
import {
  makeReferrerDetailResponseSchema,
  makeReferrerLeaderboardPageResponseSchema,
} from "./zod-schemas";

/**
 * Deserializes a {@link SerializedReferralProgramRules} object.
 */
function deserializeReferralProgramRules(
  rules: SerializedReferralProgramRules,
): ReferralProgramRules {
  return {
    totalAwardPoolValue: deserializePriceUsdc(rules.totalAwardPoolValue),
    maxQualifiedReferrers: rules.maxQualifiedReferrers,
    startTime: rules.startTime,
    endTime: rules.endTime,
    subregistryId: rules.subregistryId,
  };
}

/**
 * Deserializes an {@link SerializedAwardedReferrerMetrics} object.
 */
function deserializeAwardedReferrerMetrics(
  metrics: SerializedAwardedReferrerMetrics,
): AwardedReferrerMetrics {
  return {
    referrer: metrics.referrer,
    totalReferrals: metrics.totalReferrals,
    totalIncrementalDuration: metrics.totalIncrementalDuration,
    totalRevenueContribution: deserializePriceEth(metrics.totalRevenueContribution),
    score: metrics.score,
    rank: metrics.rank,
    isQualified: metrics.isQualified,
    finalScoreBoost: metrics.finalScoreBoost,
    finalScore: metrics.finalScore,
    awardPoolShare: metrics.awardPoolShare,
    awardPoolApproxValue: deserializePriceUsdc(metrics.awardPoolApproxValue),
  };
}

/**
 * Deserializes an {@link SerializedUnrankedReferrerMetrics} object.
 */
function deserializeUnrankedReferrerMetrics(
  metrics: SerializedUnrankedReferrerMetrics,
): UnrankedReferrerMetrics {
  return {
    referrer: metrics.referrer,
    totalReferrals: metrics.totalReferrals,
    totalIncrementalDuration: metrics.totalIncrementalDuration,
    totalRevenueContribution: deserializePriceEth(metrics.totalRevenueContribution),
    score: metrics.score,
    rank: metrics.rank,
    isQualified: metrics.isQualified,
    finalScoreBoost: metrics.finalScoreBoost,
    finalScore: metrics.finalScore,
    awardPoolShare: metrics.awardPoolShare,
    awardPoolApproxValue: deserializePriceUsdc(metrics.awardPoolApproxValue),
  };
}

/**
 * Deserializes an {@link SerializedAggregatedReferrerMetrics} object.
 */
function deserializeAggregatedReferrerMetrics(
  metrics: SerializedAggregatedReferrerMetrics,
): AggregatedReferrerMetrics {
  return {
    grandTotalReferrals: metrics.grandTotalReferrals,
    grandTotalIncrementalDuration: metrics.grandTotalIncrementalDuration,
    grandTotalRevenueContribution: deserializePriceEth(metrics.grandTotalRevenueContribution),
    grandTotalQualifiedReferrersFinalScore: metrics.grandTotalQualifiedReferrersFinalScore,
    minFinalScoreToQualify: metrics.minFinalScoreToQualify,
  };
}

/**
 * Deserializes a {@link SerializedReferrerLeaderboardPage} object.
 */
function deserializeReferrerLeaderboardPage(
  page: SerializedReferrerLeaderboardPage,
): ReferrerLeaderboardPage {
  return {
    rules: deserializeReferralProgramRules(page.rules),
    referrers: page.referrers.map(deserializeAwardedReferrerMetrics),
    aggregatedMetrics: deserializeAggregatedReferrerMetrics(page.aggregatedMetrics),
    pageContext: page.pageContext,
    accurateAsOf: page.accurateAsOf,
  };
}

/**
 * Deserializes a {@link SerializedReferrerDetailRanked} object.
 */
function deserializeReferrerDetailRanked(
  detail: SerializedReferrerDetailRanked,
): ReferrerDetailRanked {
  return {
    type: detail.type,
    rules: deserializeReferralProgramRules(detail.rules),
    referrer: deserializeAwardedReferrerMetrics(detail.referrer),
    aggregatedMetrics: deserializeAggregatedReferrerMetrics(detail.aggregatedMetrics),
    accurateAsOf: detail.accurateAsOf,
  };
}

/**
 * Deserializes a {@link SerializedReferrerDetailUnranked} object.
 */
function deserializeReferrerDetailUnranked(
  detail: SerializedReferrerDetailUnranked,
): ReferrerDetailUnranked {
  return {
    type: detail.type,
    rules: deserializeReferralProgramRules(detail.rules),
    referrer: deserializeUnrankedReferrerMetrics(detail.referrer),
    aggregatedMetrics: deserializeAggregatedReferrerMetrics(detail.aggregatedMetrics),
    accurateAsOf: detail.accurateAsOf,
  };
}

/**
 * Deserialize a {@link ReferrerLeaderboardPageResponse} object.
 *
 * Note: This function explicitly deserializes each subobject to convert string
 * RevenueContribution values back to {@link PriceEth}, then validates using Zod schemas
 * to enforce invariants on the data.
 */
export function deserializeReferrerLeaderboardPageResponse(
  maybeResponse: SerializedReferrerLeaderboardPageResponse,
  valueLabel?: string,
): ReferrerLeaderboardPageResponse {
  let deserialized: ReferrerLeaderboardPageResponse;
  switch (maybeResponse.responseCode) {
    case "ok": {
      deserialized = {
        responseCode: maybeResponse.responseCode,
        data: deserializeReferrerLeaderboardPage(maybeResponse.data),
      } as ReferrerLeaderboardPageResponse;
      break;
    }

    case "error":
      deserialized = maybeResponse;
      break;
  }

  // Then validate the deserialized structure using zod schemas
  const schema = makeReferrerLeaderboardPageResponseSchema(valueLabel);
  const parsed = schema.safeParse(deserialized);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize SerializedReferrerLeaderboardPageResponse:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

/**
 * Deserialize a {@link ReferrerDetailResponse} object.
 *
 * Note: This function explicitly deserializes each subobject to convert string
 * RevenueContribution values back to {@link PriceEth}, then validates using Zod schemas
 * to enforce invariants on the data.
 */
export function deserializeReferrerDetailResponse(
  maybeResponse: SerializedReferrerDetailResponse,
  valueLabel?: string,
): ReferrerDetailResponse {
  let deserialized: ReferrerDetailResponse;
  switch (maybeResponse.responseCode) {
    case "ok": {
      switch (maybeResponse.data.type) {
        case "ranked":
          deserialized = {
            responseCode: maybeResponse.responseCode,
            data: deserializeReferrerDetailRanked(maybeResponse.data),
          } as ReferrerDetailResponse;
          break;

        case "unranked":
          deserialized = {
            responseCode: maybeResponse.responseCode,
            data: deserializeReferrerDetailUnranked(maybeResponse.data),
          } as ReferrerDetailResponse;
          break;
      }
      break;
    }

    case "error":
      deserialized = maybeResponse;
      break;
  }

  // Then validate the deserialized structure using zod schemas
  const schema = makeReferrerDetailResponseSchema(valueLabel);
  const parsed = schema.safeParse(deserialized);

  if (parsed.error) {
    throw new Error(`Cannot deserialize ReferrerDetailResponse:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
