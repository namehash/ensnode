import { serializePrice } from "../shared";
import type {
  SerializedPaginatedAggregatedReferrersResponse,
  SerializedReferrerDetail,
  SerializedReferrerDetailResponse,
} from "./serialized-types";
import {
  type PaginatedAggregatedReferrersResponse,
  PaginatedAggregatedReferrersResponseCodes,
  type ReferrerDetailResponse,
  ReferrerDetailResponseCodes,
} from "./types";

/**
 * Serialize a {@link PaginatedAggregatedReferrersResponse} object.
 *
 * Note: Since all fields in PaginatedAggregatedReferrersResponse are already
 * serializable primitives, this function performs an identity transformation.
 * It exists to maintain consistency with the serialization pattern used
 * throughout the codebase.
 */
export function serializePaginatedAggregatedReferrersResponse(
  response: PaginatedAggregatedReferrersResponse,
): SerializedPaginatedAggregatedReferrersResponse {
  switch (response.responseCode) {
    case PaginatedAggregatedReferrersResponseCodes.Ok:
      return response;

    case PaginatedAggregatedReferrersResponseCodes.Error:
      return response;
  }
}

/**
 * Serialize a {@link ReferrerDetailResponse} object.
 *
 * Serializes the awardPoolShare.amount from bigint to string.
 */
export function serializeReferrerDetailResponse(
  response: ReferrerDetailResponse,
): SerializedReferrerDetailResponse {
  switch (response.responseCode) {
    case ReferrerDetailResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        data: {
          ...response.data,
          awardPoolShare: serializePrice(
            response.data.awardPoolShare,
          ) as SerializedReferrerDetail["awardPoolShare"],
        },
      };

    case ReferrerDetailResponseCodes.Error:
      return response;
  }
}
