import type {
  SerializedReferralProgramRulesPieSplit,
  SerializedReferrerEditionMetricsPieSplit,
  SerializedReferrerLeaderboardPagePieSplit,
} from "../award-models/pie-split/api/serialized-types";
import type {
  SerializedReferralProgramRulesRevShareLimit,
  SerializedReferrerEditionMetricsRevShareLimit,
  SerializedReferrerLeaderboardPageRevShareLimit,
} from "../award-models/rev-share-limit/api/serialized-types";
import type { ReferralProgramEditionConfig, ReferralProgramEditionSlug } from "../edition";
import type { ReferrerEditionMetrics } from "../edition-metrics";
import type { ReferrerLeaderboardPage } from "../leaderboard-page";
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
export type SerializedReferralProgramRules =
  | SerializedReferralProgramRulesPieSplit
  | SerializedReferralProgramRulesRevShareLimit;

/**
 * Serialized representation of {@link ReferrerLeaderboardPage}.
 */
export type SerializedReferrerLeaderboardPage =
  | SerializedReferrerLeaderboardPagePieSplit
  | SerializedReferrerLeaderboardPageRevShareLimit;

/**
 * Serialized representation of {@link ReferrerEditionMetrics}.
 */
export type SerializedReferrerEditionMetrics =
  | SerializedReferrerEditionMetricsPieSplit
  | SerializedReferrerEditionMetricsRevShareLimit;

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
