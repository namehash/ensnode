import { prettifyError } from "zod/v4";

import { buildUnvalidatedRealtimeIndexingStatusProjection } from "../../../indexing-status/deserialize/realtime-indexing-status-projection";
import type { Unvalidated } from "../../../shared/types";
import { type EnsApiIndexingStatusResponse, EnsApiIndexingStatusResponseCodes } from "./response";
import type { SerializedEnsApiIndexingStatusResponse } from "./serialized-response";
import {
  makeEnsApiIndexingStatusResponseSchema,
  makeSerializedEnsApiIndexingStatusResponseSchema,
} from "./zod-schemas";

/**
 * Builds an unvalidated {@link EnsApiIndexingStatusResponse} object to be
 * validated with {@link makeEnsApiIndexingStatusResponseSchema}.
 *
 * @param serializedResponse - The serialized response to build from.
 * @return An unvalidated {@link EnsApiIndexingStatusResponse} object.
 */
function buildUnvalidatedEnsApiIndexingStatusResponse(
  serializedResponse: SerializedEnsApiIndexingStatusResponse,
): Unvalidated<EnsApiIndexingStatusResponse> {
  if (serializedResponse.responseCode !== EnsApiIndexingStatusResponseCodes.Ok) {
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
 * Deserialize a {@link EnsApiIndexingStatusResponse} object.
 */
export function deserializeEnsApiIndexingStatusResponse(
  maybeResponse: Unvalidated<SerializedEnsApiIndexingStatusResponse>,
): EnsApiIndexingStatusResponse {
  const parsed = makeSerializedEnsApiIndexingStatusResponseSchema()
    .transform(buildUnvalidatedEnsApiIndexingStatusResponse)
    .pipe(makeEnsApiIndexingStatusResponseSchema())
    .safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize EnsApiIndexingStatusResponse:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

/**
 * Deserialize a {@link EnsApiIndexingStatusResponse} object.
 *
 * @deprecated Use {@link deserializeEnsApiIndexingStatusResponse} instead.
 */
export const deserializeIndexingStatusResponse = deserializeEnsApiIndexingStatusResponse;
