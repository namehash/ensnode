import { prettifyError } from "zod/v4";

import { deserializePriceEth, deserializePriceUsdc, type PriceEth } from "@ensnode/ensnode-sdk";

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
  SerializedReferrerDetailAllCyclesResponse,
  SerializedReferrerDetailRanked,
  SerializedReferrerDetailUnranked,
  SerializedReferrerLeaderboardPage,
  SerializedReferrerLeaderboardPageResponse,
  SerializedUnrankedReferrerMetrics,
} from "./serialized-types";
import type {
  ReferrerDetailAllCyclesData,
  ReferrerDetailAllCyclesResponse,
  ReferrerLeaderboardPageResponse,
} from "./types";
import {
  makeReferrerDetailAllCyclesResponseSchema,
  makeReferrerLeaderboardPageResponseSchema,
} from "./zod-schemas";

/**
 * Deserializes a {@link SerializedReferralProgramRules} object.
 */
export function deserializeReferralProgramRules(
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
 * Deserializes a {@link SerializedReferrerDetail} object (ranked or unranked).
 */
function deserializeReferrerDetail(detail: SerializedReferrerDetail): ReferrerDetail {
  switch (detail.type) {
    case "ranked":
      return deserializeReferrerDetailRanked(detail);
    case "unranked":
      return deserializeReferrerDetailUnranked(detail);
    default: {
      const _exhaustiveCheck: never = detail;
      throw new Error(`Unknown detail type: ${(_exhaustiveCheck as ReferrerDetail).type}`);
    }
  }
}

/**
 * Deserializes a {@link SerializedReferralProgramCycle} object.
 */
export function deserializeReferralProgramCycle(
  cycle: SerializedReferralProgramCycle,
): ReferralProgramCycle {
  return {
    id: cycle.id,
    displayName: cycle.displayName,
    rules: deserializeReferralProgramRules(cycle.rules),
    rulesUrl: cycle.rulesUrl,
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
 * Deserialize a {@link ReferrerDetailAllCyclesResponse} object.
 *
 * Note: This function explicitly deserializes each subobject to convert string
 * RevenueContribution values back to {@link PriceEth}, then validates using Zod schemas
 * to enforce invariants on the data.
 */
export function deserializeReferrerDetailAllCyclesResponse(
  maybeResponse: SerializedReferrerDetailAllCyclesResponse,
  valueLabel?: string,
): ReferrerDetailAllCyclesResponse {
  let deserialized: ReferrerDetailAllCyclesResponse;

  switch (maybeResponse.responseCode) {
    case "ok": {
      const data: ReferrerDetailAllCyclesData = {} as ReferrerDetailAllCyclesData;

      for (const [cycleId, detail] of Object.entries(maybeResponse.data)) {
        // Object.entries only returns existing entries, so detail is never undefined at runtime
        data[cycleId as ReferralProgramCycleId] = deserializeReferrerDetail(
          detail as SerializedReferrerDetail,
        );
      }

      deserialized = {
        responseCode: "ok",
        data,
      };
      break;
    }

    case "error":
      deserialized = maybeResponse;
      break;
  }

  // Then validate the deserialized structure using zod schemas
  const schema = makeReferrerDetailAllCyclesResponseSchema(valueLabel);
  const parsed = schema.safeParse(deserialized);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize ReferrerDetailAllCyclesResponse:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
