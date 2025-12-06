import { prettifyError } from "zod/v4";

import type {
  SerializedReferrerDetailResponse,
  SerializedReferrerLeaderboardPageResponse,
} from "./serialized-types";
import type { ReferrerDetailResponse, ReferrerLeaderboardPageResponse } from "./types";
import {
  makeReferrerDetailResponseSchema,
  makeReferrerLeaderboardPageResponseSchema,
} from "./zod-schemas";

/**
 * Deserialize a {@link ReferrerLeaderboardPageResponse} object.
 *
 * Note: While the serialized and deserialized types are identical (all fields
 * are primitives), this function performs critical validation using Zod schemas
 * to enforce invariants on the data. This ensures data integrity when receiving
 * responses from the API.
 */
export function deserializeReferrerLeaderboardPageResponse(
  maybeResponse: SerializedReferrerLeaderboardPageResponse,
  valueLabel?: string,
): ReferrerLeaderboardPageResponse {
  const schema = makeReferrerLeaderboardPageResponseSchema(valueLabel);
  const parsed = schema.safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize SerializedReferrerLeaderboardPageResponse:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

/**
 * Deserialize a {@link ReferrerDetailResponse} object.
 *
 * Note: While the serialized and deserialized types are identical (all fields
 * are primitives), this function performs critical validation using Zod schemas
 * to enforce invariants on the data. This ensures data integrity when receiving
 * responses from the API.
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
