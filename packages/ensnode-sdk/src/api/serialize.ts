import { serializeRealtimeIndexingStatusProjection } from "../ensindexer";
import { serializeRegistrarActionWithRegistration } from "../registrar-actions";
import type {
  SerializedIndexingStatusResponse,
  SerializedIndexingStatusResponseOk,
  SerializedRegistrarActionsResponse,
  SerializedRegistrarActionsResponseOk,
} from "./serialized-types";
import {
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
  type RegistrarActionsResponse,
  RegistrarActionsResponseCodes,
} from "./types";

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

export function serializeRegistrarActionsResponse(
  response: RegistrarActionsResponse,
): SerializedRegistrarActionsResponse {
  switch (response.responseCode) {
    case RegistrarActionsResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        registrarActions: response.registrarActions.map(serializeRegistrarActionWithRegistration),
      } satisfies SerializedRegistrarActionsResponseOk;

    case RegistrarActionsResponseCodes.Error:
      return response;
  }
}
