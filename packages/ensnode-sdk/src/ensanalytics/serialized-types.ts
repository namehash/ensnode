import type { SerializedPriceUsdc } from "../shared";
import type {
  PaginatedAggregatedReferrersResponse,
  PaginatedAggregatedReferrersResponseError,
  PaginatedAggregatedReferrersResponseOk,
  ReferrerDetail,
  ReferrerDetailResponse,
  ReferrerDetailResponseError,
  ReferrerDetailResponseOk,
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

/**
 * Serialized representation of {@link ReferrerDetail}.
 *
 * The awardPoolShare.amount is serialized from bigint to string.
 */
export type SerializedReferrerDetail = Omit<ReferrerDetail, "awardPoolShare"> & {
  awardPoolShare: SerializedPriceUsdc;
};

/**
 * Serialized representation of {@link ReferrerDetailResponseOk}.
 */
export type SerializedReferrerDetailResponseOk = {
  responseCode: ReferrerDetailResponseOk["responseCode"];
  data: SerializedReferrerDetail;
};

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
