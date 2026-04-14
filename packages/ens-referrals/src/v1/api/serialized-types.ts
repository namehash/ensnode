import type {
  SerializedReferralProgramEditionSummaryPieSplit,
  SerializedReferralProgramRulesPieSplit,
  SerializedReferrerEditionMetricsPieSplit,
  SerializedReferrerLeaderboardPagePieSplit,
} from "../award-models/pie-split/api/serialized-types";
import type {
  SerializedReferralProgramEditionSummaryRevShareCap,
  SerializedReferralProgramRulesRevShareCap,
  SerializedReferrerEditionMetricsRevShareCap,
  SerializedReferrerLeaderboardPageRevShareCap,
} from "../award-models/rev-share-cap/api/serialized-types";
import type { ReferralProgramEditionSlug } from "../edition";
import type { ReferrerEditionMetrics } from "../edition-metrics";
import type { ReferralProgramEditionSummary } from "../edition-summary";
import type { ReferrerLeaderboardPage } from "../leaderboard-page";
import type { ReferralProgramRules } from "../rules";
import type {
  ReferralProgramEditionSummariesData,
  ReferralProgramEditionSummariesResponse,
  ReferralProgramEditionSummariesResponseError,
  ReferralProgramEditionSummariesResponseOk,
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
  | SerializedReferralProgramRulesRevShareCap;

/**
 * Serialized representation of {@link ReferrerLeaderboardPage}.
 */
export type SerializedReferrerLeaderboardPage =
  | SerializedReferrerLeaderboardPagePieSplit
  | SerializedReferrerLeaderboardPageRevShareCap;

/**
 * Serialized representation of {@link ReferrerEditionMetrics}.
 */
export type SerializedReferrerEditionMetrics =
  | SerializedReferrerEditionMetricsPieSplit
  | SerializedReferrerEditionMetricsRevShareCap;

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
 * Serialized representation of {@link ReferralProgramEditionSummary}.
 */
export type SerializedReferralProgramEditionSummary =
  | SerializedReferralProgramEditionSummaryPieSplit
  | SerializedReferralProgramEditionSummaryRevShareCap;

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
 * Serialized representation of {@link ReferralProgramEditionSummariesData}.
 */
export interface SerializedReferralProgramEditionSummariesData
  extends Omit<ReferralProgramEditionSummariesData, "editions"> {
  editions: SerializedReferralProgramEditionSummary[];
}

/**
 * Serialized representation of {@link ReferralProgramEditionSummariesResponseOk}.
 */
export interface SerializedReferralProgramEditionSummariesResponseOk
  extends Omit<ReferralProgramEditionSummariesResponseOk, "data"> {
  data: SerializedReferralProgramEditionSummariesData;
}

/**
 * Serialized representation of {@link ReferralProgramEditionSummariesResponseError}.
 *
 * Note: All fields are already serializable, so this type is identical to the source type.
 */
export type SerializedReferralProgramEditionSummariesResponseError =
  ReferralProgramEditionSummariesResponseError;

/**
 * Serialized representation of {@link ReferralProgramEditionSummariesResponse}.
 */
export type SerializedReferralProgramEditionSummariesResponse =
  | SerializedReferralProgramEditionSummariesResponseOk
  | SerializedReferralProgramEditionSummariesResponseError;
