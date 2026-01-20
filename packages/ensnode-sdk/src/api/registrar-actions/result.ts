import {
  type AbstractResultOkTimestamped,
  ResultCodes,
  type ResultInternalServerError,
  type ResultInvalidRequest,
  type ResultServiceUnavailable,
  type UnixTimestamp,
} from "../../shared";
import type { ResponsePageContext } from "../shared";
import type { NamedRegistrarAction } from "../types";
import { serializeNamedRegistrarAction } from "./serialize";
import type { SerializedNamedRegistrarAction } from "./serialized-response";

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
 * Serialized representation of {@link RegistrarActionsResultOkData}.
 */
export interface SerializedRegistrarActionsResultOkData
  extends Omit<RegistrarActionsResultOkData, "registrarActions"> {
  registrarActions: SerializedNamedRegistrarAction[];
}

/**
 * Successful result for Registrar Actions API requests.
 */
export type RegistrarActionsResultOk = AbstractResultOkTimestamped<RegistrarActionsResultOkData>;

/**
 * Serialized representation of {@link RegistrarActionsResultOk}.
 */
export type SerializedRegistrarActionsResultOk =
  AbstractResultOkTimestamped<SerializedRegistrarActionsResultOkData>;

/**
 * Builds a successful result for Registrar Actions API requests.
 *
 * @param data - The data for the successful result
 * @param minIndexingCursor - The minimum indexing cursor timestamp
 * @returns
 */
export function buildRegistrarActionsResultOk(
  data: RegistrarActionsResultOkData,
  minIndexingCursor: UnixTimestamp,
): RegistrarActionsResultOk {
  return {
    resultCode: ResultCodes.Ok,
    data,
    minIndexingCursor,
  };
}

/**
 * Serializes a {@link RegistrarActionsResultOk} into a {@link SerializedRegistrarActionsResultOk}.
 */
export function serializeRegistrarActionsResultOk(
  result: RegistrarActionsResultOk,
): SerializedRegistrarActionsResultOk {
  return {
    ...result,
    data: {
      ...result.data,
      registrarActions: result.data.registrarActions.map(serializeNamedRegistrarAction),
    },
  };
}

/**
 * The server operation result for Registrar Actions API.
 *
 * Use the `resultCode` field to determine the specific type interpretation
 * at runtime.
 */
export type RegistrarActionsServerResult =
  | RegistrarActionsResultOk
  | ResultInvalidRequest
  | ResultInternalServerError
  | ResultServiceUnavailable;
