import { serializeRealtimeIndexingStatusProjection } from "../ensindexer";
import {
  SerializedIndexingStatusResponse,
  SerializedIndexingStatusResponseOk,
} from "./serialized-types";
import { type IndexingStatusResponse, IndexingStatusResponseCodes } from "./types";

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
