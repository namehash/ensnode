import type { SerializedPaginatedAggregatedReferrersResponse } from "./serialized-types";
import {
  type PaginatedAggregatedReferrersResponse,
  PaginatedAggregatedReferrersResponseCodes,
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
