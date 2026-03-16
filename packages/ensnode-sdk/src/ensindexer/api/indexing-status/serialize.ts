import { serializeRealtimeIndexingStatusProjection } from "../../../indexing-status/serialize/realtime-indexing-status-projection";
import {
  type EnsIndexerIndexingStatusResponse,
  EnsIndexerIndexingStatusResponseCodes,
} from "./response";
import type {
  SerializedEnsIndexerIndexingStatusResponse,
  SerializedEnsIndexerIndexingStatusResponseOk,
} from "./serialized-response";

export function serializeEnsIndexerIndexingStatusResponse(
  response: EnsIndexerIndexingStatusResponse,
): SerializedEnsIndexerIndexingStatusResponse {
  switch (response.responseCode) {
    case EnsIndexerIndexingStatusResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        realtimeProjection: serializeRealtimeIndexingStatusProjection(response.realtimeProjection),
      } satisfies SerializedEnsIndexerIndexingStatusResponseOk;

    case EnsIndexerIndexingStatusResponseCodes.Error:
      return response;
  }
}
