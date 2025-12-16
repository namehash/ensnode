import type { InterpretedName } from "../../ens";
import type { RegistrarAction } from "../../registrars";
import type { IndexingStatusResponseCodes } from "../indexing-status";
import type { ErrorResponse } from "../shared/errors";
import type { ResponsePageContext } from "../shared/pagination";

/**
 * A status code for Registrar Actions API responses.
 */
export const RegistrarActionsResponseCodes = {
  /**
   * Represents that Registrar Actions are available.
   */
  Ok: "ok",

  /**
   * Represents that Registrar Actions are unavailable.
   */
  Error: "error",
} as const;

/**
 * The derived string union of possible {@link RegistrarActionsResponseCodes}.
 */
export type RegistrarActionsResponseCode =
  (typeof RegistrarActionsResponseCodes)[keyof typeof RegistrarActionsResponseCodes];

/**
 * "Logical registrar action" with its associated name.
 */
export interface NamedRegistrarAction {
  action: RegistrarAction;

  /**
   * Name
   *
   * FQDN of the name associated with `action`.
   *
   * Guarantees:
   * - `namehash(name)` is always `action.registrationLifecycle.node`.
   */
  name: InterpretedName;
}

/**
 * A response when Registrar Actions are available.
 */
export type RegistrarActionsResponseOk = {
  responseCode: typeof RegistrarActionsResponseCodes.Ok;
  registrarActions: NamedRegistrarAction[];
  pageContext: ResponsePageContext;
};

/**
 * A response when Registrar Actions are unavailable.
 */
export interface RegistrarActionsResponseError {
  responseCode: typeof IndexingStatusResponseCodes.Error;
  error: ErrorResponse;
}

/**
 * Registrar Actions response.
 *
 * Use the `responseCode` field to determine the specific type interpretation
 * at runtime.
 */
export type RegistrarActionsResponse = RegistrarActionsResponseOk | RegistrarActionsResponseError;
