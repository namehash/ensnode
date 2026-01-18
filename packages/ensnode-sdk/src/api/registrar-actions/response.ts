import type { InterpretedName } from "../../ens";
import type { RegistrarAction } from "../../registrars";
import type { OpResultServer, UnixTimestamp } from "../../shared";
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

  /**
   * The {@link UnixTimestamp} of when the data used to build the list of {@link NamedRegistrarAction} was accurate as of.
   *
   * @remarks
   * **Note:** This value represents the `slowestChainIndexingCursor` from the latest omnichain indexing status
   * snapshot captured by ENSApi. The state returned in the response is guaranteed to be accurate as of this
   * timestamp but may be from a timestamp higher than this value.
   *
   * **Temporary:** This field is currently optional to maintain backward compatibility with ENS Awards
   * using older snapshot NPM packages. This will be changed to required in a future release.
   * See: https://github.com/namehash/ensnode/issues/1497
   */
  accurateAsOf?: UnixTimestamp;
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

export interface RegistrarActionsResultOkData {
  registrarActions: NamedRegistrarAction[];
  pageContext: ResponsePageContext;
}

/**
 * Registrar Actions Result
 *
 * Use the `resultCode` field to determine the specific type interpretation
 * at runtime.
 */
export type RegistrarActionsResult = OpResultServer<RegistrarActionsResultOkData>;
