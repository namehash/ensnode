/**
 * This module defines a standardized way to represent the outcome of operations,
 * encapsulating both successful results and error results.
 */

/**
 * Possible Result Codes.
 */
export const ResultCodes = {
  Ok: "ok",
  Error: "error",
} as const;

export type ResultCode = (typeof ResultCodes)[keyof typeof ResultCodes];

/**
 * Value type useful for `ResultOk` type.
 */
export interface ResultOkValue<ValueCodeType> {
  valueCode: ValueCodeType;
}

/**
 * Result Ok returned by a successful operation call.
 */
export interface ResultOk<ValueType> {
  resultCode: typeof ResultCodes.Ok;
  value: ValueType;
}

/**
 * Value type useful for `ResultError` type.
 */
export interface ResultErrorValue<ErrorCodeType> {
  errorCode: ErrorCodeType;
}

/**
 * Result Error returned by a failed operation call.
 */
export interface ResultError<ErrorType> {
  resultCode: typeof ResultCodes.Error;
  value: ErrorType;
}

/**
 * Result returned by an operation.
 *
 * Guarantees:
 * - `resultCode` indicates if operation succeeded or failed.
 * - `value` describes the outcome of the operation, for example
 *   - {@link ResultOkValue} for successful operation call.
 *   - {@link ResultErrorValue} for failed operation call.
 */
export type Result<OkType, ErrorType> = ResultOk<OkType> | ResultError<ErrorType>;

/**
 * Type for marking error as a transient one.
 *
 * It's useful for downstream consumers to know, so they can attempt fetching
 * the result once again.
 */
export type ErrorTransient<ErrorType> = ErrorType & { transient: true };
