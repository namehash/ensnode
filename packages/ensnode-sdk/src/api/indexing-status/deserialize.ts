import z, { prettifyError } from "zod/v4";

import { buildUnvalidatedRealtimeIndexingStatusProjection } from "../../ensindexer/indexing-status/deserialize/realtime-indexing-status-projection";
import { IndexingStatusResponseCodes } from "../types";
import type { IndexingStatusResponse } from "./response";
import type { SerializedIndexingStatusResponse } from "./serialized-response";
import {
  makeIndexingStatusResponseSchema,
  makeSerializedIndexingStatusResponseSchema,
} from "./zod-schemas";

/**
 * Build unvalidated indexing status response to be validated.
 *
 * Return type is intentionally "unknown" to enforce validation by
 * {@link makeIndexingStatusResponseSchema} call.
 */
function buildUnvalidatedIndexingStatusResponse(
  serializedResponse: SerializedIndexingStatusResponse,
): unknown {
  if (serializedResponse.responseCode === IndexingStatusResponseCodes.Error) {
    return serializedResponse;
  }

  const { responseCode, realtimeProjection } = serializedResponse;

  return {
    responseCode,
    realtimeProjection: buildUnvalidatedRealtimeIndexingStatusProjection(realtimeProjection),
  };
}

/**
 * Deserialize a {@link IndexingStatusResponse} object.
 */
export function deserializeIndexingStatusResponse(
  maybeResponse: SerializedIndexingStatusResponse,
): IndexingStatusResponse {
  const parsed = makeSerializedIndexingStatusResponseSchema()
    .pipe(z.preprocess(buildUnvalidatedIndexingStatusResponse, makeIndexingStatusResponseSchema()))
    .safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(`Cannot deserialize IndexingStatusResponse:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
