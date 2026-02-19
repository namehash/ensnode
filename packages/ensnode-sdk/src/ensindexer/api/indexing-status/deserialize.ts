import { prettifyError } from "zod/v4";

import { buildUnvalidatedRealtimeIndexingStatusProjection } from "../../../indexing-status/deserialize/realtime-indexing-status-projection";
import type { Unvalidated } from "../../../shared/types";
import {
  type EnsIndexerIndexingStatusResponse,
  EnsIndexerIndexingStatusResponseCodes,
} from "./response";
import type { SerializedEnsIndexerIndexingStatusResponse } from "./serialized-response";
import {
  makeEnsIndexerIndexingStatusResponseSchema,
  makeSerializedEnsIndexerIndexingStatusResponseSchema,
} from "./zod-schemas";

/**
 * Builds an unvalidated {@link EnsIndexerIndexingStatusResponse} object to be
 * validated with {@link makeEnsIndexerIndexingStatusResponseSchema}.
 *
 * @param serializedResponse - The serialized response to build from.
 * @return An unvalidated {@link EnsIndexerIndexingStatusResponse} object.
 */
function buildUnvalidatedEnsIndexerIndexingStatusResponse(
  serializedResponse: SerializedEnsIndexerIndexingStatusResponse,
): Unvalidated<EnsIndexerIndexingStatusResponse> {
  if (serializedResponse.responseCode !== EnsIndexerIndexingStatusResponseCodes.Ok) {
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
 * Deserialize a {@link EnsIndexerIndexingStatusResponse} object.
 */
export function deserializeEnsIndexerIndexingStatusResponse(
  maybeResponse: Unvalidated<SerializedEnsIndexerIndexingStatusResponse>,
): EnsIndexerIndexingStatusResponse {
  const parsed = makeSerializedEnsIndexerIndexingStatusResponseSchema()
    .transform(buildUnvalidatedEnsIndexerIndexingStatusResponse)
    .pipe(makeEnsIndexerIndexingStatusResponseSchema())
    .safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize EnsIndexerIndexingStatusResponse:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
