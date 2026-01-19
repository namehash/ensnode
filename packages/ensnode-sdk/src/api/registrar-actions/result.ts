import type {
  ResultInternalServerError,
  ResultServerOk,
  ResultServiceUnavailable,
} from "../../shared";
import type { ResponsePageContext } from "../shared";
import type { NamedRegistrarAction } from "../types";

export interface RegistrarActionsResultOkData {
  /**
   * The list of "logical registrar actions" with their associated names.
   */
  registrarActions: NamedRegistrarAction[];

  /**
   * The pagination context for the current page of results.
   */
  pageContext: ResponsePageContext;
}

/**
 * The operation result for Registrar Actions API requests.
 *
 * Use the `resultCode` field to determine the specific type interpretation
 * at runtime.
 */
export type RegistrarActionsResult =
  | ResultServerOk<RegistrarActionsResultOkData>
  | ResultInternalServerError
  | ResultServiceUnavailable;
