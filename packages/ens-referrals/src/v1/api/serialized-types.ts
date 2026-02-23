import type {
  SerializedAggregatedReferrerMetricsPieSplit,
  SerializedAwardedReferrerMetricsPieSplit,
  SerializedReferralProgramRulesPieSplit,
  SerializedReferrerEditionMetricsRankedPieSplit,
  SerializedReferrerEditionMetricsUnrankedPieSplit,
  SerializedReferrerLeaderboardPagePieSplit,
  SerializedUnrankedReferrerMetricsPieSplit,
} from "../award-models/pie-split/api/serialized-types";
import type {
  SerializedAggregatedReferrerMetricsRevShareLimit,
  SerializedAwardedReferrerMetricsRevShareLimit,
  SerializedReferralProgramRulesRevShareLimit,
  SerializedReferrerEditionMetricsRankedRevShareLimit,
  SerializedReferrerEditionMetricsUnrankedRevShareLimit,
  SerializedReferrerLeaderboardPageRevShareLimit,
  SerializedUnrankedReferrerMetricsRevShareLimit,
} from "../award-models/rev-share-limit/api/serialized-types";
import type { ReferralProgramEditionConfig, ReferralProgramEditionSlug } from "../edition";
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
 * Serialized representation of an unknown future award model rules object.
 * Unknown types are already JSON-safe (arrived via deserialization passthrough).
 */
export type SerializedReferralProgramRulesUnknown = { awardModel: string } & Record<
  string,
  unknown
>;

/**
 * Serialized representation of referral program rules (union of all award model variants).
 */
export type SerializedReferralProgramRules =
  | SerializedReferralProgramRulesPieSplit
  | SerializedReferralProgramRulesRevShareLimit
  | SerializedReferralProgramRulesUnknown;

/**
 * Serialized representation of aggregated referrer metrics (union of all award model variants).
 */
export type SerializedAggregatedReferrerMetrics =
  | SerializedAggregatedReferrerMetricsPieSplit
  | SerializedAggregatedReferrerMetricsRevShareLimit;

/**
 * Serialized representation of awarded referrer metrics (union of all award model variants).
 */
export type SerializedAwardedReferrerMetrics =
  | SerializedAwardedReferrerMetricsPieSplit
  | SerializedAwardedReferrerMetricsRevShareLimit;

/**
 * Serialized representation of unranked referrer metrics (union of all award model variants).
 */
export type SerializedUnrankedReferrerMetrics =
  | SerializedUnrankedReferrerMetricsPieSplit
  | SerializedUnrankedReferrerMetricsRevShareLimit;

/**
 * Serialized representation of {@link ReferrerLeaderboardPage}.
 */
export type SerializedReferrerLeaderboardPage =
  | SerializedReferrerLeaderboardPagePieSplit
  | SerializedReferrerLeaderboardPageRevShareLimit;

/**
 * Serialized representation of {@link ReferrerEditionMetricsRanked}.
 */
export type SerializedReferrerEditionMetricsRanked =
  | SerializedReferrerEditionMetricsRankedPieSplit
  | SerializedReferrerEditionMetricsRankedRevShareLimit;

/**
 * Serialized representation of {@link ReferrerEditionMetricsUnranked}.
 */
export type SerializedReferrerEditionMetricsUnranked =
  | SerializedReferrerEditionMetricsUnrankedPieSplit
  | SerializedReferrerEditionMetricsUnrankedRevShareLimit;

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
