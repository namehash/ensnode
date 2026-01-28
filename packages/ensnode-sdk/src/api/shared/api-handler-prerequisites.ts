import type { RealtimeIndexingStatusProjection } from "../../ensindexer/indexing-status";
import {
  type AbstractResultOk,
  ResultCodes,
  type ResultInsufficientIndexingProgress,
  type ResultInternalServerError,
  type ResultServiceUnavailable,
} from "../../shared/result";

/**
 * Data included with a successful Indexing Status for supported API result.
 */
export interface ResultOkApiHandlerPrerequisitesValidationData {
  indexingStatus: RealtimeIndexingStatusProjection;
}

/**
 * Successful result for API handler prerequisites validation.
 */
export type ResultOkApiHandlerPrerequisitesValidation =
  AbstractResultOk<ResultOkApiHandlerPrerequisitesValidationData>;

export function buildResultOkApiHandlerPrerequisitesValidation(
  data: ResultOkApiHandlerPrerequisitesValidationData,
): ResultOkApiHandlerPrerequisitesValidation {
  return {
    resultCode: ResultCodes.Ok,
    data,
  };
}

/**
 * The operation result for validating API handler prerequisites.
 *
 * Use the `resultCode` field to determine the specific type interpretation
 * at runtime.
 */
export type ApiHandlerPrerequisitesValidationResult =
  | ResultOkApiHandlerPrerequisitesValidation
  | ResultInternalServerError
  | ResultServiceUnavailable
  | ResultInsufficientIndexingProgress;
