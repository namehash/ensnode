import type {
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
