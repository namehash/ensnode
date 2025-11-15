import { prettifyError } from "zod/v4";

import type { SerializedPaginatedAggregatedReferrersResponse } from "./serialized-types";
import type { PaginatedAggregatedReferrersResponse } from "./types";
import { makePaginatedAggregatedReferrersResponseSchema } from "./zod-schemas";

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
