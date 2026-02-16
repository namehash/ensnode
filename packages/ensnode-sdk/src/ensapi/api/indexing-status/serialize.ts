import { serializeRealtimeIndexingStatusProjection } from "../../../indexing-status/serialize/realtime-indexing-status-projection";
import { type EnsApiIndexingStatusResponse, EnsApiIndexingStatusResponseCodes } from "./response";
import type {
  SerializedEnsApiIndexingStatusResponse,
  SerializedEnsApiIndexingStatusResponseOk,
} from "./serialized-response";

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

export const serializeIndexingStatusResponse = serializeEnsApiIndexingStatusResponse;
