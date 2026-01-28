import {
  type AbstractResultOkTimestamped,
  ResultCodes,
  type ResultInsufficientIndexingProgress,
  type ResultInternalServerError,
  type ResultInvalidRequest,
  type ResultServiceUnavailable,
  type UnixTimestamp,
} from "../../shared";
import type { ResponsePageContext } from "../shared";
import type { NamedRegistrarAction } from "../types";
import { serializeNamedRegistrarAction } from "./serialize";
import type { SerializedNamedRegistrarAction } from "./serialized-response";

/**
 * Data included with a successful Registrar Actions result.
 */
export interface ResultOkRegistrarActionsData {
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
 * Serialized representation of {@link ResultOkRegistrarActionsData}.
 */
export interface SerializedResultOkRegistrarActionsData
  extends Omit<ResultOkRegistrarActionsData, "registrarActions"> {
  registrarActions: SerializedNamedRegistrarAction[];
}

/**
 * Successful result for Registrar Actions API requests.
 */
export type ResultOkRegistrarActions = AbstractResultOkTimestamped<ResultOkRegistrarActionsData>;

/**
 * Serialized representation of {@link ResultOkRegistrarActions}.
 */
export type SerializedResultOkRegistrarActions =
  AbstractResultOkTimestamped<SerializedResultOkRegistrarActionsData>;

/**
 * Builds a successful result for Registrar Actions API requests.
 *
 * @param data - The data for the successful result
 * @param minIndexingCursor - The minimum indexing cursor timestamp
 * @returns The successful result object with data guaranteed to be up to
 *          the specified indexing cursor.
 */
export function buildResultOkRegistrarActions(
  data: ResultOkRegistrarActionsData,
  minIndexingCursor: UnixTimestamp,
): ResultOkRegistrarActions {
  return {
    resultCode: ResultCodes.Ok,
    data,
    minIndexingCursor,
  };
}

/**
 * Serializes a {@link ResultOkRegistrarActions} into a {@link SerializedResultOkRegistrarActions}.
 */
export function serializeResultOkRegistrarActions(
  result: ResultOkRegistrarActions,
): SerializedResultOkRegistrarActions {
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
  | ResultOkRegistrarActions
  | ResultInvalidRequest
  | ResultInternalServerError
  | ResultServiceUnavailable // used when Indexing Status couldn't be determined yet
  | ResultInsufficientIndexingProgress; // used when Indexing Status could be determined but indexing progress was insufficient
