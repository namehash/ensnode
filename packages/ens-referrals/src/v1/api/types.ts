import type { Address } from "viem";

import type { ReferrerLeaderboardPageParams } from "../award-models/shared/leaderboard-page";
import type { ReferralProgramEditionSlug } from "../edition";
import type { ReferrerEditionMetrics } from "../edition-metrics";
import type { ReferralProgramEditionSummary } from "../edition-summary";
import type { ReferrerLeaderboardPage } from "../leaderboard-page";

/**
 * Request parameters for a referrer leaderboard page query.
 */
export interface ReferrerLeaderboardPageRequest extends ReferrerLeaderboardPageParams {
  /** The referral program edition slug */
  edition: ReferralProgramEditionSlug;
}

/**
 * A status code for a referrer leaderboard page API response.
 */
export const ReferrerLeaderboardPageResponseCodes = {
  /**
   * Represents that the requested referrer leaderboard page is available.
   */
  Ok: "ok",

  /**
   * Represents that the referrer leaderboard data is not available.
   */
  Error: "error",
} as const;

/**
 * The derived string union of possible {@link ReferrerLeaderboardPageResponseCodes}.
 */
export type ReferrerLeaderboardPageResponseCode =
  (typeof ReferrerLeaderboardPageResponseCodes)[keyof typeof ReferrerLeaderboardPageResponseCodes];

/**
 * A referrer leaderboard page response when the data is available.
 */
export type ReferrerLeaderboardPageResponseOk = {
  responseCode: typeof ReferrerLeaderboardPageResponseCodes.Ok;
  data: ReferrerLeaderboardPage;
};

/**
 * A referrer leaderboard page response when the data is not available.
 */
export type ReferrerLeaderboardPageResponseError = {
  responseCode: typeof ReferrerLeaderboardPageResponseCodes.Error;
  error: string;
  errorMessage: string;
};

/**
 * A referrer leaderboard page API response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type ReferrerLeaderboardPageResponse =
  | ReferrerLeaderboardPageResponseOk
  | ReferrerLeaderboardPageResponseError;

/**
 * Maximum number of editions that can be requested in a single {@link ReferrerMetricsEditionsRequest}.
 */
export const MAX_EDITIONS_PER_REQUEST = 20;

/**
 * Request parameters for referrer metrics query.
 */
export interface ReferrerMetricsEditionsRequest {
  /** The Ethereum address of the referrer to query */
  referrer: Address;
  /** Array of edition slugs to query (min 1, max {@link MAX_EDITIONS_PER_REQUEST}, must be distinct) */
  editions: ReferralProgramEditionSlug[];
}

/**
 * A status code for referrer metrics API responses.
 */
export const ReferrerMetricsEditionsResponseCodes = {
  /**
   * Represents that the referrer metrics data for the requested editions is available.
   */
  Ok: "ok",

  /**
   * Represents that an error occurred while fetching the data.
   */
  Error: "error",
} as const;

/**
 * The derived string union of possible {@link ReferrerMetricsEditionsResponseCodes}.
 */
export type ReferrerMetricsEditionsResponseCode =
  (typeof ReferrerMetricsEditionsResponseCodes)[keyof typeof ReferrerMetricsEditionsResponseCodes];

/**
 * Referrer metrics data for requested editions.
 *
 * Maps each requested edition slug to the referrer's metrics for that edition.
 * Uses Partial because TypeScript cannot know at compile time which specific edition
 * slugs are requested. At runtime, when responseCode is Ok, all requested edition slugs
 * are guaranteed to be present in this record.
 */
export type ReferrerMetricsEditionsData = Partial<
  Record<ReferralProgramEditionSlug, ReferrerEditionMetrics>
>;

/**
 * A successful response containing referrer metrics for the requested editions.
 */
export type ReferrerMetricsEditionsResponseOk = {
  responseCode: typeof ReferrerMetricsEditionsResponseCodes.Ok;
  data: ReferrerMetricsEditionsData;
};

/**
 * A referrer metrics editions response when an error occurs.
 */
export type ReferrerMetricsEditionsResponseError = {
  responseCode: typeof ReferrerMetricsEditionsResponseCodes.Error;
  error: string;
  errorMessage: string;
};

/**
 * A referrer metrics editions API response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type ReferrerMetricsEditionsResponse =
  | ReferrerMetricsEditionsResponseOk
  | ReferrerMetricsEditionsResponseError;

/**
 * A status code for referral program edition summaries API responses.
 */
export const ReferralProgramEditionSummariesResponseCodes = {
  /**
   * Represents that the edition summaries are available.
   */
  Ok: "ok",

  /**
   * Represents that the edition summaries are not available.
   */
  Error: "error",
} as const;

/**
 * The derived string union of possible {@link ReferralProgramEditionSummariesResponseCodes}.
 */
export type ReferralProgramEditionSummariesResponseCode =
  (typeof ReferralProgramEditionSummariesResponseCodes)[keyof typeof ReferralProgramEditionSummariesResponseCodes];

/**
 * The data payload containing edition summaries.
 * Editions are sorted in descending order by start timestamp.
 */
export type ReferralProgramEditionSummariesData = {
  editions: ReferralProgramEditionSummary[];
};

/**
 * A successful response containing edition summaries.
 */
export type ReferralProgramEditionSummariesResponseOk = {
  responseCode: typeof ReferralProgramEditionSummariesResponseCodes.Ok;
  data: ReferralProgramEditionSummariesData;
};

/**
 * An edition summaries response when an error occurs.
 */
export type ReferralProgramEditionSummariesResponseError = {
  responseCode: typeof ReferralProgramEditionSummariesResponseCodes.Error;
  error: string;
  errorMessage: string;
};

/**
 * A referral program edition summaries API response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type ReferralProgramEditionSummariesResponse =
  | ReferralProgramEditionSummariesResponseOk
  | ReferralProgramEditionSummariesResponseError;
