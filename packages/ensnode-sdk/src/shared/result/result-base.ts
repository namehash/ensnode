import type { ResultCode, ResultCodeError, ResultCodes } from "./result-code";

/************************************************************
 * Abstract results
 *
 * These are base interfaces that should be extended to
 * create concrete result types.
 ************************************************************/

/**
 * Abstract representation of any result.
 */
export interface AbstractResult<TResultCode extends ResultCode> {
  /**
   * The classification of the result.
   */
  resultCode: TResultCode;
}

/**
 * Abstract representation of a successful result.
 */
export interface AbstractResultOk<TDataType> extends AbstractResult<typeof ResultCodes.Ok> {
  /**
   * The data of the result.
   */
  data: TDataType;
}

/**
 * Abstract representation of an error result.
 */
export interface AbstractResultError<TResultCode extends ResultCodeError, TDataType = undefined>
  extends AbstractResult<TResultCode> {
  /**
   * A description of the error.
   */
  errorMessage: string;

  /**
   * Identifies if it may be relevant to retry the operation.
   *
   * If `false`, retrying the operation is unlikely tobe helpful.
   */
  suggestRetry: boolean;

  /**
   * Optional data associated with the error.
   */
  data?: TDataType;
}

/**
 * Abstract representation of a loading result.
 */
export interface AbstractResultLoading<TDataType = undefined>
  extends AbstractResult<typeof ResultCodes.Loading> {
  /**
   * Optional data associated with the loading operation.
   */
  data?: TDataType;
}
