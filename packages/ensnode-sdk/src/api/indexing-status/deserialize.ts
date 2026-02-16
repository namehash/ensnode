import { prettifyError } from "zod/v4";

import { buildUnvalidatedRealtimeIndexingStatusProjection } from "../../ensindexer/indexing-status/deserialize/realtime-indexing-status-projection";
import type { Unvalidated } from "../../shared/types";
import { type IndexingStatusResponse, IndexingStatusResponseCodes } from "./response";
import type { SerializedIndexingStatusResponse } from "./serialized-response";
import {
  makeIndexingStatusResponseSchema,
  makeSerializedIndexingStatusResponseSchema,
} from "./zod-schemas";

/**
 * Builds an unvalidated {@link IndexingStatusResponse} object to be
 * validated with {@link makeIndexingStatusResponseSchema}.
 *
 * @param serializedResponse - The serialized response to build from.
 * @return An unvalidated {@link IndexingStatusResponse} object.
 */
function buildUnvalidatedIndexingStatusResponse(
  serializedResponse: SerializedIndexingStatusResponse,
): Unvalidated<IndexingStatusResponse> {
  if (serializedResponse.responseCode !== IndexingStatusResponseCodes.Ok) {
    return serializedResponse;
  }

  return {
    ...serializedResponse,
    realtimeProjection: buildUnvalidatedRealtimeIndexingStatusProjection(
      serializedResponse.realtimeProjection,
    ),
  };
}

/**
 * Deserialize a {@link IndexingStatusResponse} object.
 */
export function deserializeIndexingStatusResponse(
  maybeResponse: Unvalidated<SerializedIndexingStatusResponse>,
): IndexingStatusResponse {
  const parsed = makeSerializedIndexingStatusResponseSchema()
    .transform(buildUnvalidatedIndexingStatusResponse)
    .pipe(makeIndexingStatusResponseSchema())
    .safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(`Cannot deserialize IndexingStatusResponse:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
