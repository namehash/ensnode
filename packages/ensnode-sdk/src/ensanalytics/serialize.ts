import type { SerializedReferrerLeaderboardPageResponse } from "./serialized-types";
import {
  type ReferrerLeaderboardPageResponse,
  ReferrerLeaderboardPageResponseCodes,
} from "./types";

/**
 * Serialize a {@link ReferrerLeaderboardPageResponse} object.
 *
 * Note: Since all fields in ReferrerLeaderboardPageResponse are already
 * serializable primitives, this function performs an identity transformation.
 * It exists to maintain consistency with the serialization pattern used
 * throughout the codebase.
 */
export function serializeReferrerLeaderboardPageResponse(
  response: ReferrerLeaderboardPageResponse,
): SerializedReferrerLeaderboardPageResponse {
  switch (response.responseCode) {
    case ReferrerLeaderboardPageResponseCodes.Ok:
      return response;

    case ReferrerLeaderboardPageResponseCodes.Error:
      return response;
  }
}
