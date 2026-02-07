import type { SerializedPriceEth, SerializedPriceUsdc } from "@ensnode/ensnode-sdk";

import type { AggregatedReferrerMetrics } from "../aggregations";
import type { ReferralProgramCycleConfig, ReferralProgramCycleSlug } from "../cycle";
import type { ReferrerLeaderboardPage } from "../leaderboard-page";
import type { ReferrerDetailRanked, ReferrerDetailUnranked } from "../referrer-detail";
import type { AwardedReferrerMetrics, UnrankedReferrerMetrics } from "../referrer-metrics";
import type { ReferralProgramRules } from "../rules";
import type {
  ReferralProgramCycleConfigSetData,
  ReferralProgramCycleConfigSetResponse,
  ReferralProgramCycleConfigSetResponseError,
  ReferralProgramCycleConfigSetResponseOk,
  ReferrerDetailCyclesResponse,
  ReferrerDetailCyclesResponseError,
  ReferrerDetailCyclesResponseOk,
  ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseError,
  ReferrerLeaderboardPageResponseOk,
} from "./types";

/**
 * Serialized representation of {@link ReferralProgramRules}.
 */
export interface SerializedReferralProgramRules
  extends Omit<ReferralProgramRules, "totalAwardPoolValue" | "rulesUrl"> {
  totalAwardPoolValue: SerializedPriceUsdc;
  rulesUrl: string;
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
 * Serialized representation of {@link ReferralProgramCycleConfig}.
 */
export interface SerializedReferralProgramCycleConfig
  extends Omit<ReferralProgramCycleConfig, "rules"> {
  rules: SerializedReferralProgramRules;
}

/**
 * Serialized representation of referrer detail data for requested cycles.
 * Uses Partial because TypeScript cannot know at compile time which specific cycle
 * slugs are requested. At runtime, when responseCode is Ok, all requested cycle slugs
 * are guaranteed to be present in this record.
 */
export type SerializedReferrerDetailCyclesData = Partial<
  Record<ReferralProgramCycleSlug, SerializedReferrerDetail>
>;

/**
 * Serialized representation of {@link ReferrerDetailCyclesResponseOk}.
 */
export interface SerializedReferrerDetailCyclesResponseOk
  extends Omit<ReferrerDetailCyclesResponseOk, "data"> {
  data: SerializedReferrerDetailCyclesData;
}

/**
 * Serialized representation of {@link ReferrerDetailCyclesResponseError}.
 *
 * Note: All fields are already serializable, so this type is identical to the source type.
 */
export type SerializedReferrerDetailCyclesResponseError = ReferrerDetailCyclesResponseError;

/**
 * Serialized representation of {@link ReferrerDetailCyclesResponse}.
 */
export type SerializedReferrerDetailCyclesResponse =
  | SerializedReferrerDetailCyclesResponseOk
  | SerializedReferrerDetailCyclesResponseError;

/**
 * Serialized representation of {@link ReferralProgramCycleConfigSetData}.
 */
export interface SerializedReferralProgramCycleConfigSetData
  extends Omit<ReferralProgramCycleConfigSetData, "cycles"> {
  cycles: SerializedReferralProgramCycleConfig[];
}

/**
 * Serialized representation of {@link ReferralProgramCycleConfigSetResponseOk}.
 */
export interface SerializedReferralProgramCycleConfigSetResponseOk
  extends Omit<ReferralProgramCycleConfigSetResponseOk, "data"> {
  data: SerializedReferralProgramCycleConfigSetData;
}

/**
 * Serialized representation of {@link ReferralProgramCycleConfigSetResponseError}.
 *
 * Note: All fields are already serializable, so this type is identical to the source type.
 */
export type SerializedReferralProgramCycleConfigSetResponseError =
  ReferralProgramCycleConfigSetResponseError;

/**
 * Serialized representation of {@link ReferralProgramCycleConfigSetResponse}.
 */
export type SerializedReferralProgramCycleConfigSetResponse =
  | SerializedReferralProgramCycleConfigSetResponseOk
  | SerializedReferralProgramCycleConfigSetResponseError;
