import type {
  ReferrerDetailResponse,
  ReferrerDetailResponseError,
  ReferrerDetailResponseOk,
  ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseError,
  ReferrerLeaderboardPageResponseOk,
} from "./types";

/**
 * Serialized representation of {@link ReferrerLeaderboardPageResponseError}.
 *
 * Note: All fields are already serializable, so this type is identical to the source type.
 */
export type SerializedReferrerLeaderboardPageResponseError = ReferrerLeaderboardPageResponseError;

/**
 * Serialized representation of {@link ReferrerLeaderboardPageResponseOk}.
 *
 * Note: All fields are already serializable, so this type is identical to the source type.
 */
export type SerializedReferrerLeaderboardPageResponseOk = ReferrerLeaderboardPageResponseOk;

/**
 * Serialized representation of {@link ReferrerLeaderboardPageResponse}.
 */
export type SerializedReferrerLeaderboardPageResponse =
  | SerializedReferrerLeaderboardPageResponseOk
  | SerializedReferrerLeaderboardPageResponseError;

/**
 * Serialized representation of {@link ReferrerDetailResponseOk}.
 *
 * Note: All fields in ReferrerDetailData and UnrankedReferrerDetailData
 * (AwardedReferrerMetrics or UnrankedReferrerMetrics + timestamp) are already serializable primitives.
 * The rank field can be either a number or null, both of which are valid JSON primitives.
 */
export type SerializedReferrerDetailResponseOk = ReferrerDetailResponseOk;

/**
 * Serialized representation of {@link ReferrerDetailResponseError}.
 *
 * Note: All fields are already serializable, so this type is identical to the source type.
 */
export type SerializedReferrerDetailResponseError = ReferrerDetailResponseError;

/**
 * Serialized representation of {@link ReferrerDetailResponse}.
 */
export type SerializedReferrerDetailResponse =
  | SerializedReferrerDetailResponseOk
  | SerializedReferrerDetailResponseError;
