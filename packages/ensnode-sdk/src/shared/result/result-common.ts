/************************************************************
 * Internal Server Error
 ************************************************************/

import type { AbstractResultError } from "./result-base";
import { type ResultCode, ResultCodes } from "./result-code";

export interface ResultInternalServerError
  extends AbstractResultError<typeof ResultCodes.InternalServerError> {}

/**
 * Builds a result object representing an internal server error.
 */
export const buildResultInternalServerError = (
  errorMessage?: string,
  suggestRetry: boolean = true,
): ResultInternalServerError => {
  return {
    resultCode: ResultCodes.InternalServerError,
    errorMessage: errorMessage ?? "An unknown internal server error occurred.",
    suggestRetry,
  };
};

/************************************************************
 * Not Found
 ************************************************************/

export interface ResultNotFound extends AbstractResultError<typeof ResultCodes.NotFound> {}

/**
 * Builds a result object representing a not found error.
 */
export const buildResultNotFound = (
  errorMessage?: string,
  suggestRetry: boolean = false,
): ResultNotFound => {
  return {
    resultCode: ResultCodes.NotFound,
    errorMessage: errorMessage ?? "Requested resource not found.",
    suggestRetry,
  };
};

/************************************************************
 * Invalid Request
 ************************************************************/

export interface ResultInvalidRequest
  extends AbstractResultError<typeof ResultCodes.InvalidRequest> {}

/**
 * Builds a result object representing an invalid request error.
 */
export const buildResultInvalidRequest = (
  errorMessage?: string,
  suggestRetry: boolean = false,
): ResultInvalidRequest => {
  return {
    resultCode: ResultCodes.InvalidRequest,
    errorMessage: errorMessage ?? "Invalid request.",
    suggestRetry,
  };
};

/************************************************************
 * Connection Error
 ************************************************************/

export interface ResultConnectionError
  extends AbstractResultError<typeof ResultCodes.ConnectionError> {}

/**
 * Builds a result object representing a connection error.
 */
export const buildResultConnectionError = (
  errorMessage?: string,
  suggestRetry: boolean = true,
): ResultConnectionError => {
  return {
    resultCode: ResultCodes.ConnectionError,
    errorMessage: errorMessage ?? "Connection error.",
    suggestRetry,
  };
};

/************************************************************
 * Request Timeout
 ************************************************************/

export interface ResultRequestTimeout
  extends AbstractResultError<typeof ResultCodes.RequestTimeout> {}

/**
 * Builds a result object representing a request timeout error.
 */
export const buildResultRequestTimeout = (
  errorMessage?: string,
  suggestRetry: boolean = true,
): ResultRequestTimeout => {
  return {
    resultCode: ResultCodes.RequestTimeout,
    errorMessage: errorMessage ?? "Request timed out.",
    suggestRetry,
  };
};

/************************************************************
 * Client-Unrecognized Operation Result
 ************************************************************/

/**
 * Represents an operation result with a result code that is not recognized
 * by this client version.
 *
 * Relevant for cases where a client is running version X while the server
 * is running version X+N and the server returns a result code that is not
 * recognized by a client for a specific operation because the result code
 * exists in version X+N for the operation on the server but not in the
 * version X for the operation on the client and therefore needs
 * transformation into a fallback result code for the client that is safe
 * for recognition by clients that are running version X.
 */
export interface ResultClientUnrecognizedOperationResult
  extends AbstractResultError<typeof ResultCodes.ClientUnrecognizedOperationResult> {}

/**
 * Builds a result object representing an unrecognized operation result.
 */
export const buildResultClientUnrecognizedOperationResult = (
  unrecognizedResult: unknown,
): ResultClientUnrecognizedOperationResult => {
  let errorMessage = "An unrecognized result for the operation occurred.";
  let suggestRetry = true;

  if (typeof unrecognizedResult === "object" && unrecognizedResult !== null) {
    if (
      "errorMessage" in unrecognizedResult &&
      typeof unrecognizedResult.errorMessage === "string"
    ) {
      errorMessage = unrecognizedResult.errorMessage;
    }
    if (
      "suggestRetry" in unrecognizedResult &&
      typeof unrecognizedResult.suggestRetry === "boolean"
    ) {
      suggestRetry = unrecognizedResult.suggestRetry;
    }
  }

  return {
    resultCode: ResultCodes.ClientUnrecognizedOperationResult,
    errorMessage,
    suggestRetry,
  };
};

/**
 * Checks if a result code is recognized for a specific operation.
 */
export const isRecognizedResultCodeForOperation = (
  resultCode: ResultCode | string,
  recognizedResultCodesForOperation: readonly ResultCode[],
): boolean => {
  // Checks if resultCode is one of the recognizedResultCodes for an operation
  return recognizedResultCodesForOperation.includes(resultCode as ResultCode);
};

/************************************************************
 * All common client errors
 ************************************************************/

export type ResultClientError =
  | ResultConnectionError
  | ResultRequestTimeout
  | ResultClientUnrecognizedOperationResult;
