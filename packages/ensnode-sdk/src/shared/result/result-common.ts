/************************************************************
 * Internal Server Error
 ************************************************************/

import type { AbstractResult, AbstractResultError } from "./result-base";
import { type ResultCode, type ResultCodeError, ResultCodes } from "./result-code";

export interface ResultInternalServerError
  extends AbstractResultError<typeof ResultCodes.InternalServerError> {}

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
 * Unknown Error
 ************************************************************/

/**
 * Represents an error result that is not recognized by the SDK.
 *
 * Relevant for cases where a client is running version X while the server
 * is running version X+N and the server returns a result code that is not
 * recognized by a client because the result code exist in the version X+N
 * but not in the version X and therefore needs transformation into a
 * fallback result code that will be recognized in version X.
 */
export interface ResultErrorUnrecognized
  extends Omit<AbstractResultError<ResultCodeError>, "resultCode"> {
  /**
   * The result code that is not recognized by the SDK but was returned by the server.
   */
  resultCode: string;
}

export interface ResultUnknownError extends AbstractResultError<typeof ResultCodes.UnknownError> {}

export const buildResultUnknownError = (
  unrecognizedError: ResultErrorUnrecognized,
): ResultUnknownError => {
  return {
    resultCode: ResultCodes.UnknownError,
    errorMessage: unrecognizedError.errorMessage,
    suggestRetry: unrecognizedError.suggestRetry,
  };
};

export const isUnrecognizedResult = (
  result: AbstractResult<any>,
  recognizedResultCodes: readonly ResultCode[],
): result is ResultErrorUnrecognized => {
  // Checks if result.resultCode is not one of the recognized ResultCodes for an operation
  return (
    typeof result.resultCode === "string" &&
    !recognizedResultCodes.includes(result.resultCode as ResultCode)
  );
};

/************************************************************
 * All common client errors
 ************************************************************/

export type ResultClientError = ResultConnectionError | ResultRequestTimeout | ResultUnknownError;
