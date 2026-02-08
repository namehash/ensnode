import type { SerializedPriceEth, SerializedPriceUsdc } from "@ensnode/ensnode-sdk";

import type { AggregatedReferrerMetrics } from "../aggregations";
import type { ReferralProgramEditionConfig, ReferralProgramEditionSlug } from "../edition";
import type {
  ReferrerEditionMetricsRanked,
  ReferrerEditionMetricsUnranked,
} from "../edition-metrics";
import type { ReferrerLeaderboardPage } from "../leaderboard-page";
import type { AwardedReferrerMetrics, UnrankedReferrerMetrics } from "../referrer-metrics";
import type { ReferralProgramRules } from "../rules";
import type {
  ReferralProgramEditionConfigSetData,
  ReferralProgramEditionConfigSetResponse,
  ReferralProgramEditionConfigSetResponseError,
  ReferralProgramEditionConfigSetResponseOk,
  ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseError,
  ReferrerLeaderboardPageResponseOk,
  ReferrerMetricsEditionsResponse,
  ReferrerMetricsEditionsResponseError,
  ReferrerMetricsEditionsResponseOk,
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
 * Serialized representation of {@link ReferrerEditionMetricsRanked}.
 */
export interface SerializedReferrerEditionMetricsRanked
  extends Omit<ReferrerEditionMetricsRanked, "rules" | "referrer" | "aggregatedMetrics"> {
  rules: SerializedReferralProgramRules;
  referrer: SerializedAwardedReferrerMetrics;
  aggregatedMetrics: SerializedAggregatedReferrerMetrics;
}

/**
 * Serialized representation of {@link ReferrerEditionMetricsUnranked}.
 */
export interface SerializedReferrerEditionMetricsUnranked
  extends Omit<ReferrerEditionMetricsUnranked, "rules" | "referrer" | "aggregatedMetrics"> {
  rules: SerializedReferralProgramRules;
  referrer: SerializedUnrankedReferrerMetrics;
  aggregatedMetrics: SerializedAggregatedReferrerMetrics;
}

/**
 * Serialized representation of {@link ReferrerEditionMetrics} (union of ranked and unranked).
 */
export type SerializedReferrerEditionMetrics =
  | SerializedReferrerEditionMetricsRanked
  | SerializedReferrerEditionMetricsUnranked;

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
 * Serialized representation of {@link ReferralProgramEditionConfig}.
 */
export interface SerializedReferralProgramEditionConfig
  extends Omit<ReferralProgramEditionConfig, "rules"> {
  rules: SerializedReferralProgramRules;
}

/**
 * Serialized representation of referrer metrics data for requested editions.
 * Uses Partial because TypeScript cannot know at compile time which specific edition
 * slugs are requested. At runtime, when responseCode is Ok, all requested edition slugs
 * are guaranteed to be present in this record.
 */
export type SerializedReferrerMetricsEditionsData = Partial<
  Record<ReferralProgramEditionSlug, SerializedReferrerEditionMetrics>
>;

/**
 * Serialized representation of {@link ReferrerMetricsEditionsResponseOk}.
 */
export interface SerializedReferrerMetricsEditionsResponseOk
  extends Omit<ReferrerMetricsEditionsResponseOk, "data"> {
  data: SerializedReferrerMetricsEditionsData;
}

/**
 * Serialized representation of {@link ReferrerMetricsEditionsResponseError}.
 *
 * Note: All fields are already serializable, so this type is identical to the source type.
 */
export type SerializedReferrerMetricsEditionsResponseError = ReferrerMetricsEditionsResponseError;

/**
 * Serialized representation of {@link ReferrerMetricsEditionsResponse}.
 */
export type SerializedReferrerMetricsEditionsResponse =
  | SerializedReferrerMetricsEditionsResponseOk
  | SerializedReferrerMetricsEditionsResponseError;

/**
 * Serialized representation of {@link ReferralProgramEditionConfigSetData}.
 */
export interface SerializedReferralProgramEditionConfigSetData
  extends Omit<ReferralProgramEditionConfigSetData, "editions"> {
  editions: SerializedReferralProgramEditionConfig[];
}

/**
 * Serialized representation of {@link ReferralProgramEditionConfigSetResponseOk}.
 */
export interface SerializedReferralProgramEditionConfigSetResponseOk
  extends Omit<ReferralProgramEditionConfigSetResponseOk, "data"> {
  data: SerializedReferralProgramEditionConfigSetData;
}

/**
 * Serialized representation of {@link ReferralProgramEditionConfigSetResponseError}.
 *
 * Note: All fields are already serializable, so this type is identical to the source type.
 */
export type SerializedReferralProgramEditionConfigSetResponseError =
  ReferralProgramEditionConfigSetResponseError;

/**
 * Serialized representation of {@link ReferralProgramEditionConfigSetResponse}.
 */
export type SerializedReferralProgramEditionConfigSetResponse =
  | SerializedReferralProgramEditionConfigSetResponseOk
  | SerializedReferralProgramEditionConfigSetResponseError;
