import { serializeRealtimeIndexingStatusProjection } from "../../../indexing-status/serialize/realtime-indexing-status-projection";
import { serializeEnsApiPublicConfig } from "../../config/serialize";
import { type EnsApiIndexingStatusResponse, EnsApiIndexingStatusResponseCodes } from "./response";
import type {
  SerializedEnsApiIndexingStatusResponse,
  SerializedEnsApiIndexingStatusResponseOk,
} from "./serialized-response";

/**
 * Serialize a {@link EnsApiIndexingStatusResponse} object.
 */
export function serializeEnsApiIndexingStatusResponse(
  response: EnsApiIndexingStatusResponse,
): SerializedEnsApiIndexingStatusResponse {
  switch (response.responseCode) {
    case EnsApiIndexingStatusResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        realtimeProjection: serializeRealtimeIndexingStatusProjection(response.realtimeProjection),
        config: serializeEnsApiPublicConfig(response.config),
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
