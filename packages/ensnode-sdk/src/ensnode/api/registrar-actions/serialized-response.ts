import type { SerializedRegistrarAction } from "../../../registrars/registrar-action";
import type {
  NamedRegistrarAction,
  RegistrarActionsResponseError,
  RegistrarActionsResponseOk,
} from "./response";

/**
 * Serialized representation of {@link RegistrarActionsResponseError}.
 */
export type SerializedRegistrarActionsResponseError = RegistrarActionsResponseError;

/**
 * Serialized representation of {@link NamedRegistrarAction}.
 */
export interface SerializedNamedRegistrarAction extends Omit<NamedRegistrarAction, "action"> {
  action: SerializedRegistrarAction;
}

/**
 * Serialized representation of {@link RegistrarActionsResponseOk}.
 */
export interface SerializedRegistrarActionsResponseOk
  extends Omit<RegistrarActionsResponseOk, "registrarActions"> {
  registrarActions: SerializedNamedRegistrarAction[];
}

/**
 * Serialized representation of {@link SerializedRegistrarActionsResponse}.
 */
export type SerializedRegistrarActionsResponse =
  | SerializedRegistrarActionsResponseOk
  | SerializedRegistrarActionsResponseError;
