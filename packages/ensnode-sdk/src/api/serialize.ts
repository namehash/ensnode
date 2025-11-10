import { serializeRealtimeIndexingStatusProjection } from "../ensindexer";
import { serializeRegistrarAction } from "../registrars";
import type {
  SerializedIndexingStatusResponse,
  SerializedIndexingStatusResponseOk,
  SerializedRegistrarActionsResponse,
  SerializedRegistrarActionsResponseOk,
  SerializedRegistrarActionWithDomain,
} from "./serialized-types";
import {
  type IndexingStatusResponse,
  IndexingStatusResponseCodes,
  type RegistrarActionsResponse,
  RegistrarActionsResponseCodes,
  type RegistrarActionWithDomain,
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

export function serializeRegistrarActionWithDomain(
  registrarAction: RegistrarActionWithDomain,
): SerializedRegistrarActionWithDomain {
  const serializedRegistrarAction = serializeRegistrarAction(registrarAction);
  return {
    ...serializedRegistrarAction,
    registrationLifecycle: {
      ...serializedRegistrarAction.registrationLifecycle,
      domain: registrarAction.registrationLifecycle.domain,
    },
  };
}

export function serializeRegistrarActionsResponse(
  response: RegistrarActionsResponse,
): SerializedRegistrarActionsResponse {
  switch (response.responseCode) {
    case RegistrarActionsResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        registrarActions: response.registrarActions.map(serializeRegistrarActionWithDomain),
      } satisfies SerializedRegistrarActionsResponseOk;

    case RegistrarActionsResponseCodes.Error:
      return response;
  }
}
