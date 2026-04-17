import { prettifyError } from "zod/v4";

import { buildUnvalidatedRealtimeIndexingStatusProjection } from "../../../indexing-status/deserialize/realtime-indexing-status-projection";
import type { Unvalidated } from "../../../shared/types";
import { buildUnvalidatedEnsNodeStackInfo } from "../../../stack-info/deserialize/ensnode-stack-info";
import {
  type EnsApiIndexingStatusResponse,
  EnsApiIndexingStatusResponseCodes,
  type EnsApiIndexingStatusResponseError,
  type EnsApiIndexingStatusResponseOk,
} from "./response";
import type {
  SerializedEnsApiIndexingStatusResponse,
  SerializedEnsApiIndexingStatusResponseError,
  SerializedEnsApiIndexingStatusResponseOk,
} from "./serialized-response";
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

  const { realtimeProjection, stackInfo, ...rest } = serializedResponse;

  return {
    realtimeProjection: buildUnvalidatedRealtimeIndexingStatusProjection(realtimeProjection),
    stackInfo: buildUnvalidatedEnsNodeStackInfo(stackInfo),
    ...rest,
  };
}

/**
 * Deserialize a {@link EnsApiIndexingStatusResponse} object.
 */
export function deserializeEnsApiIndexingStatusResponse(
  maybeResponse: Unvalidated<SerializedEnsApiIndexingStatusResponseOk>,
): EnsApiIndexingStatusResponseOk;
export function deserializeEnsApiIndexingStatusResponse(
  maybeResponse: Unvalidated<SerializedEnsApiIndexingStatusResponseError>,
): EnsApiIndexingStatusResponseError;
export function deserializeEnsApiIndexingStatusResponse(
  maybeResponse: Unvalidated<SerializedEnsApiIndexingStatusResponse>,
): EnsApiIndexingStatusResponse;
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
