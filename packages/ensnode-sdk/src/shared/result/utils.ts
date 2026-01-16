/**
 * This file defines utilities for working with the Result generic type.
 * Functionalities should be use to enhance developer experience while
 * interacting with ENSNode APIs.
 */

import {
  type AbstractResult,
  type AbstractResultError,
  type AbstractResultOk,
  type ErrorResultCode,
  type ResultCode,
  ResultCodes,
} from "./types";

export function isResultOk<ResultType extends AbstractResult<ResultCode>>(
  result: AbstractResult<ResultCode>,
): result is AbstractResultOk<ResultType> {
  return result.resultCode === ResultCodes.Ok;
}

export function isResultError(
  result: AbstractResult<ResultCode>,
): result is AbstractResultError<ErrorResultCode> {
  return !isResultOk(result);
}
