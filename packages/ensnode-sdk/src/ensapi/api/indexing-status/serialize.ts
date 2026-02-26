import { serializeRealtimeIndexingStatusProjection } from "../../../indexing-status/serialize/realtime-indexing-status-projection";
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

/**
 * Serialize a {@link EnsApiIndexingStatusResponse} object.
 */
export function serializeEnsApiIndexingStatusResponse(
  response: EnsApiIndexingStatusResponseOk,
): SerializedEnsApiIndexingStatusResponseOk;
export function serializeEnsApiIndexingStatusResponse(
  response: EnsApiIndexingStatusResponseError,
): SerializedEnsApiIndexingStatusResponseError;
export function serializeEnsApiIndexingStatusResponse(
  response: EnsApiIndexingStatusResponse,
): SerializedEnsApiIndexingStatusResponse;
export function serializeEnsApiIndexingStatusResponse(
  response: EnsApiIndexingStatusResponse,
): SerializedEnsApiIndexingStatusResponse {
  switch (response.responseCode) {
    case EnsApiIndexingStatusResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        realtimeProjection: serializeRealtimeIndexingStatusProjection(response.realtimeProjection),
      } satisfies SerializedEnsApiIndexingStatusResponseOk;

    case EnsApiIndexingStatusResponseCodes.Error:
      return response;
  }
}

/**
 * Serialize a {@link EnsApiIndexingStatusResponse} object.
 *
 * @deprecated Use {@link serializeEnsApiIndexingStatusResponse} instead.
 */
export const serializeIndexingStatusResponse = serializeEnsApiIndexingStatusResponse;
