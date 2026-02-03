import type { SerializedPriceEth, SerializedPriceUsdc } from "@ensnode/ensnode-sdk";

import type { AggregatedReferrerMetrics } from "../aggregations";
import type { ReferralProgramCycle, ReferralProgramCycleId } from "../cycle";
import type { ReferrerLeaderboardPage } from "../leaderboard-page";
import type { ReferrerDetailRanked, ReferrerDetailUnranked } from "../referrer-detail";
import type { AwardedReferrerMetrics, UnrankedReferrerMetrics } from "../referrer-metrics";
import type { ReferralProgramRules } from "../rules";
import type {
  ReferrerDetailAllCyclesResponse,
  ReferrerDetailAllCyclesResponseError,
  ReferrerDetailAllCyclesResponseOk,
  ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseError,
  ReferrerLeaderboardPageResponseOk,
} from "./types";

/**
 * Serialized representation of {@link ReferralProgramRules}.
 */
export interface SerializedReferralProgramRules
  extends Omit<ReferralProgramRules, "totalAwardPoolValue"> {
  totalAwardPoolValue: SerializedPriceUsdc;
}

/**
 * Serialized representation of {@link AwardedReferrerMetrics}.
 */
export interface SerializedAwardedReferrerMetrics
  extends Omit<AwardedReferrerMetrics, "totalRevenueContribution" | "awardPoolApproxValue"> {
  totalRevenueContribution: SerializedPriceEth;
  awardPoolApproxValue: SerializedPriceUsdc;
}

/**
 * Serialized representation of {@link UnrankedReferrerMetrics}.
 */
export interface SerializedUnrankedReferrerMetrics
  extends Omit<UnrankedReferrerMetrics, "totalRevenueContribution" | "awardPoolApproxValue"> {
  totalRevenueContribution: SerializedPriceEth;
  awardPoolApproxValue: SerializedPriceUsdc;
}

/**
 * Serialized representation of {@link AggregatedReferrerMetrics}.
 */
export interface SerializedAggregatedReferrerMetrics
  extends Omit<AggregatedReferrerMetrics, "grandTotalRevenueContribution"> {
  grandTotalRevenueContribution: SerializedPriceEth;
}

/**
 * Serialized representation of {@link ReferrerLeaderboardPage}.
 */
export interface SerializedReferrerLeaderboardPage
  extends Omit<ReferrerLeaderboardPage, "rules" | "referrers" | "aggregatedMetrics"> {
  rules: SerializedReferralProgramRules;
  referrers: SerializedAwardedReferrerMetrics[];
  aggregatedMetrics: SerializedAggregatedReferrerMetrics;
}

/**
 * Serialized representation of {@link ReferrerDetailRanked}.
 */
export interface SerializedReferrerDetailRanked
  extends Omit<ReferrerDetailRanked, "rules" | "referrer" | "aggregatedMetrics"> {
  rules: SerializedReferralProgramRules;
  referrer: SerializedAwardedReferrerMetrics;
  aggregatedMetrics: SerializedAggregatedReferrerMetrics;
}

/**
 * Serialized representation of {@link ReferrerDetailUnranked}.
 */
export interface SerializedReferrerDetailUnranked
  extends Omit<ReferrerDetailUnranked, "rules" | "referrer" | "aggregatedMetrics"> {
  rules: SerializedReferralProgramRules;
  referrer: SerializedUnrankedReferrerMetrics;
  aggregatedMetrics: SerializedAggregatedReferrerMetrics;
}

/**
 * Serialized representation of {@link ReferrerDetail} (union of ranked and unranked).
 */
export type SerializedReferrerDetail =
  | SerializedReferrerDetailRanked
  | SerializedReferrerDetailUnranked;

/**
 * Serialized representation of {@link ReferrerLeaderboardPageResponseError}.
 *
 * Note: All fields are already serializable, so this type is identical to the source type.
 */
export type SerializedReferrerLeaderboardPageResponseError = ReferrerLeaderboardPageResponseError;

/**
 * Serialized representation of {@link ReferrerLeaderboardPageResponseOk}.
 */
export interface SerializedReferrerLeaderboardPageResponseOk
  extends Omit<ReferrerLeaderboardPageResponseOk, "data"> {
  data: SerializedReferrerLeaderboardPage;
}

/**
 * Serialized representation of {@link ReferrerLeaderboardPageResponse}.
 */
export type SerializedReferrerLeaderboardPageResponse =
  | SerializedReferrerLeaderboardPageResponseOk
  | SerializedReferrerLeaderboardPageResponseError;

/**
 * Serialized representation of {@link ReferralProgramCycle}.
 */
export interface SerializedReferralProgramCycle extends Omit<ReferralProgramCycle, "rules"> {
  rules: SerializedReferralProgramRules;
}

/**
 * Serialized representation of referrer detail data across all cycles.
 */
export type SerializedReferrerDetailAllCyclesData = Record<
  ReferralProgramCycleId,
  SerializedReferrerDetail
>;

/**
 * Serialized representation of {@link ReferrerDetailAllCyclesResponseOk}.
 */
export interface SerializedReferrerDetailAllCyclesResponseOk
  extends Omit<ReferrerDetailAllCyclesResponseOk, "data"> {
  data: SerializedReferrerDetailAllCyclesData;
}

/**
 * Serialized representation of {@link ReferrerDetailAllCyclesResponseError}.
 *
 * Note: All fields are already serializable, so this type is identical to the source type.
 */
export type SerializedReferrerDetailAllCyclesResponseError = ReferrerDetailAllCyclesResponseError;

/**
 * Serialized representation of {@link ReferrerDetailAllCyclesResponse}.
 */
export type SerializedReferrerDetailAllCyclesResponse =
  | SerializedReferrerDetailAllCyclesResponseOk
  | SerializedReferrerDetailAllCyclesResponseError;
