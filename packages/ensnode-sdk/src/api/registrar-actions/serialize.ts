import { serializeRegistrarAction } from "../../registrars";
import {
  type NamedRegistrarAction,
  type RegistrarActionsResponse,
  RegistrarActionsResponseCodes,
} from "./response";
import type {
  SerializedNamedRegistrarAction,
  SerializedRegistrarActionsResponse,
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
