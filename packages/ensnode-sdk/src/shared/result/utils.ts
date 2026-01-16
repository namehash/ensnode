/**
 * This file defines utilities for working with the Result generic type.
 * Functionalities should be use to enhance developer experience while
 * interacting with ENSNode APIs.
 */

import {
  type ErrorTransient,
  type Result,
  ResultCodes,
  type ResultError,
  type ResultErrorValue,
  type ResultOk,
  type ResultOkValue,
} from "./types";

/**
 * Build a Result Ok from provided `data`.
 *
 * Requires `data` to include the `valueCode` property
 * It enables the consumer of a Result object to identify `data` the result hold.
 */
export function resultOk<const OkValueType, OkType extends ResultOkValue<OkValueType>>(
  value: OkType,
): ResultOk<OkType> {
  return {
    resultCode: ResultCodes.Ok,
    value,
  };
}

/**
 * Is a result an instance of ResultOk?
 */
export function isResultOk<DataType, ErrorType>(
  result: Pick<Result<DataType, ErrorType>, "resultCode">,
): result is ResultOk<DataType> {
  return result.resultCode === ResultCodes.Ok;
}

/**
 * Build a Result Error from provided `error`.
 *
 * Requires `error` to include the `errorCode` property
 * It enables the consumer of a Result object to identify `error` the result hold.
 */
export function resultError<
  const ErrorValueType,
  ErrorType extends ResultErrorValue<ErrorValueType>,
>(value: ErrorType): ResultError<ErrorType> {
  return {
    resultCode: ResultCodes.Error,
    value,
  };
}

/**
 * Is a result error?
 */
export function isResultError<DataType, ErrorType>(
  result: Pick<Result<DataType, ErrorType>, "resultCode">,
): result is ResultError<ErrorType> {
  return result.resultCode === ResultCodes.Error;
}

/**
 * Is value an instance of a result type?
 */
export function isResult(value: unknown): value is Result<unknown, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "resultCode" in value &&
    (value.resultCode === ResultCodes.Ok || value.resultCode === ResultCodes.Error)
  );
}

/**
 * Build a new instance of `error` and mark it as transient.
 *
 * This "mark" informs downstream consumer about the transient nature of
 * the error.
 */
export function errorTransient<ErrorType>(error: ErrorType): ErrorTransient<ErrorType> {
  return { ...error, transient: true };
}

/**
 * Is error a transient one?
 */
export function isErrorTransient<ErrorType>(error: ErrorType): error is ErrorTransient<ErrorType> {
  return (
    typeof error === "object" && error !== null && "transient" in error && error.transient === true
  );
}
