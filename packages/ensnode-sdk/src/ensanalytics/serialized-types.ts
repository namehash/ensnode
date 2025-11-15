import type {
  PaginatedAggregatedReferrersResponse,
  PaginatedAggregatedReferrersResponseError,
  PaginatedAggregatedReferrersResponseOk,
} from "./types";

/**
 * Serialized representation of {@link PaginatedAggregatedReferrersResponseError}.
 *
 * Note: All fields are already serializable, so this type is identical to the source type.
 */
export type SerializedPaginatedAggregatedReferrersResponseError =
  PaginatedAggregatedReferrersResponseError;

/**
 * Serialized representation of {@link PaginatedAggregatedReferrersResponseOk}.
 *
 * Note: All fields are already serializable, so this type is identical to the source type.
 */
export type SerializedPaginatedAggregatedReferrersResponseOk =
  PaginatedAggregatedReferrersResponseOk;

/**
 * Serialized representation of {@link PaginatedAggregatedReferrersResponse}.
 */
export type SerializedPaginatedAggregatedReferrersResponse =
  | SerializedPaginatedAggregatedReferrersResponseOk
  | SerializedPaginatedAggregatedReferrersResponseError;
