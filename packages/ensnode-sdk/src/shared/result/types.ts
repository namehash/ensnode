/**
 * This module defines a standardized way to represent the outcome of operations,
 * encapsulating both successful results and error results.
 */

/**
 * Possible Result Codes.
 */
export const ResultCodes = {
  Ok: "ok",
  ServerError: "server-error",
} as const;

export type ResultCode = (typeof ResultCodes)[keyof typeof ResultCodes];

export type ErrorResultCode = Exclude<ResultCode, typeof ResultCodes.Ok>;

/**
 * Abstract representation of any result.
 */
export interface AbstractResult<ResultCode> {
  resultCode: ResultCode;
}

/**
 * Abstract representation of a successful result.
 */
export interface AbstractResultOk<DataType> extends AbstractResult<typeof ResultCodes.Ok> {
  resultCode: typeof ResultCodes.Ok;
  data: DataType;
}

export interface AbstractResultError<ResultCode extends ErrorResultCode>
  extends AbstractResult<ResultCode> {
  errorMessage: string;
  transient: boolean;
}

export interface AbstractResultErrorData<ResultCode extends ErrorResultCode, DataType>
  extends AbstractResultError<ResultCode> {
  data: DataType;
}
