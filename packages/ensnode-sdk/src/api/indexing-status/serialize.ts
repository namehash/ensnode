import { serializeRealtimeIndexingStatusProjection } from "../../ensindexer";
import { type IndexingStatusResponse, IndexingStatusResponseCodes } from "./response";
import type {
  SerializedIndexingStatusResponse,
  SerializedIndexingStatusResponseOk,
} from "./serialized-response";

export function serializeIndexingStatusResponse(
  response: IndexingStatusResponse,
): SerializedIndexingStatusResponse {
  switch (response.responseCode) {
    case IndexingStatusResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        realtimeProjection: serializeRealtimeIndexingStatusProjection(response.realtimeProjection),
      } satisfies SerializedIndexingStatusResponseOk;

    case IndexingStatusResponseCodes.Error:
      return response;
  }
}
