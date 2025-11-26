import { prettifyError } from "zod/v4";

import type {
  SerializedPaginatedAggregatedReferrersResponse,
  SerializedReferrerDetailResponse,
} from "./serialized-types";
import type { PaginatedAggregatedReferrersResponse, ReferrerDetailResponse } from "./types";
import {
  makePaginatedAggregatedReferrersResponseSchema,
  makeReferrerDetailResponseSchema,
} from "./zod-schemas";

/**
 * Deserialize a {@link PaginatedAggregatedReferrersResponse} object.
 *
 * Note: While the serialized and deserialized types are identical (all fields
 * are primitives), this function performs critical validation using Zod schemas
 * to enforce invariants on the data. This ensures data integrity when receiving
 * responses from the API.
 */
export function deserializePaginatedAggregatedReferrersResponse(
  maybeResponse: SerializedPaginatedAggregatedReferrersResponse,
  valueLabel?: string,
): PaginatedAggregatedReferrersResponse {
  const schema = makePaginatedAggregatedReferrersResponseSchema(valueLabel);
  const parsed = schema.safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize PaginatedAggregatedReferrersResponse:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

/**
 * Deserialize a {@link ReferrerDetailResponse} object.
 */
export function deserializeReferrerDetailResponse(
  maybeResponse: SerializedReferrerDetailResponse,
  valueLabel?: string,
): ReferrerDetailResponse {
  const schema = makeReferrerDetailResponseSchema(valueLabel);
  const parsed = schema.safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(`Cannot deserialize ReferrerDetailResponse:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
