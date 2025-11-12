import { serializeRealtimeIndexingStatusProjection } from "../ensindexer";
import { serializeRegistrarAction } from "../registrars";
import type {
  SerializedIndexingStatusResponse,
  SerializedIndexingStatusResponseOk,
  SerializedNamedRegistrarAction,
  SerializedRegistrarActionsResponse,
  SerializedRegistrarActionsResponseOk,
} from "./serialized-types";
import {
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
  type NamedRegistrarAction,
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

export function serializeNamedRegistrarAction({
  action,
  name,
}: NamedRegistrarAction): SerializedNamedRegistrarAction {
  return {
    action: serializeRegistrarAction(action),
    name,
  };
}

export function serializeRegistrarActionsResponse(
  response: RegistrarActionsResponse,
): SerializedRegistrarActionsResponse {
  switch (response.responseCode) {
    case RegistrarActionsResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        registrarActions: response.registrarActions.map(serializeNamedRegistrarAction),
      } satisfies SerializedRegistrarActionsResponseOk;

    case RegistrarActionsResponseCodes.Error:
      return response;
  }
}
