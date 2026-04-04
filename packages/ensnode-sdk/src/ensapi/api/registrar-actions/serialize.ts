import { serializeRegistrarAction } from "../../../registrars/registrar-action";
import {
  type NamedRegistrarAction,
  type RegistrarActionsResponse,
  RegistrarActionsResponseCodes,
  type RegistrarActionsResponseError,
  type RegistrarActionsResponseOk,
} from "./response";
import type {
  SerializedNamedRegistrarAction,
  SerializedRegistrarActionsResponse,
  SerializedRegistrarActionsResponseError,
  SerializedRegistrarActionsResponseOk,
} from "./serialized-response";

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
  response: RegistrarActionsResponseOk,
): SerializedRegistrarActionsResponseOk;
export function serializeRegistrarActionsResponse(
  response: RegistrarActionsResponseError,
): SerializedRegistrarActionsResponseError;
export function serializeRegistrarActionsResponse(
  response: RegistrarActionsResponse,
): SerializedRegistrarActionsResponse {
  switch (response.responseCode) {
    case RegistrarActionsResponseCodes.Ok:
      return {
        responseCode: response.responseCode,
        registrarActions: response.registrarActions.map(serializeNamedRegistrarAction),
        pageContext: response.pageContext,
        accurateAsOf: response.accurateAsOf,
      } satisfies SerializedRegistrarActionsResponseOk;

    case RegistrarActionsResponseCodes.Error:
      return response;
  }
}
