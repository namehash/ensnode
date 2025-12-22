import type {
  AggregatedReferrerMetrics,
  AwardedReferrerMetrics,
  ReferralProgramRules,
  ReferrerDetailRanked,
  ReferrerDetailUnranked,
  ReferrerLeaderboardPage,
  UnrankedReferrerMetrics,
} from "@namehash/ens-referrals";

import type {
  ReferrerDetailResponse,
  ReferrerDetailResponseError,
  ReferrerDetailResponseOk,
  ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseError,
  ReferrerLeaderboardPageResponseOk,
} from "./types";

/**
 * Serialized representation of {@link RevenueContribution}.
 *
 * RevenueContribution is a bigint, which is serialized as a string for JSON compatibility.
 */
export type SerializedRevenueContribution = string;

/**
 * Serialized representation of {@link ReferralProgramRules}.
 *
 * Note: All fields are already serializable primitives, so this type is identical to the source type.
 */
export type SerializedReferralProgramRules = ReferralProgramRules;

/**
 * Serialized representation of {@link AwardedReferrerMetrics}.
 */
export interface SerializedAwardedReferrerMetrics
  extends Omit<AwardedReferrerMetrics, "totalRevenueContribution"> {
  totalRevenueContribution: SerializedRevenueContribution;
}

/**
 * Serialized representation of {@link UnrankedReferrerMetrics}.
 */
export interface SerializedUnrankedReferrerMetrics
  extends Omit<UnrankedReferrerMetrics, "totalRevenueContribution"> {
  totalRevenueContribution: SerializedRevenueContribution;
}

/**
 * Serialized representation of {@link AggregatedReferrerMetrics}.
 */
export interface SerializedAggregatedReferrerMetrics
  extends Omit<AggregatedReferrerMetrics, "grandTotalRevenueContribution"> {
  grandTotalRevenueContribution: SerializedRevenueContribution;
}

/**
 * Serialized representation of {@link ReferrerLeaderboardPage}.
 */
export interface SerializedReferrerLeaderboardPage
  extends Omit<ReferrerLeaderboardPage, "referrers" | "aggregatedMetrics"> {
  referrers: SerializedAwardedReferrerMetrics[];
  aggregatedMetrics: SerializedAggregatedReferrerMetrics;
}

/**
 * Serialized representation of {@link ReferrerDetailRanked}.
 */
export interface SerializedReferrerDetailRanked
  extends Omit<ReferrerDetailRanked, "referrer" | "aggregatedMetrics"> {
  referrer: SerializedAwardedReferrerMetrics;
  aggregatedMetrics: SerializedAggregatedReferrerMetrics;
}

/**
 * Serialized representation of {@link ReferrerDetailUnranked}.
 */
export interface SerializedReferrerDetailUnranked
  extends Omit<ReferrerDetailUnranked, "referrer" | "aggregatedMetrics"> {
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
 * Serialized representation of {@link ReferrerDetailResponseError}.
 *
 * Note: All fields are already serializable, so this type is identical to the source type.
 */
export type SerializedReferrerDetailResponseError = ReferrerDetailResponseError;

/**
 * Serialized representation of {@link ReferrerDetailResponseOk}.
 */
export interface SerializedReferrerDetailResponseOk extends Omit<ReferrerDetailResponseOk, "data"> {
  data: SerializedReferrerDetail;
}

/**
 * Serialized representation of {@link ReferrerDetailResponse}.
 */
export type SerializedReferrerDetailResponse =
  | SerializedReferrerDetailResponseOk
  | SerializedReferrerDetailResponseError;
