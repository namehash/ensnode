// in this file we define errors that are common across multiple operations

import { type AbstractResultError, ResultCodes } from "./types";

// NOTE: the following is just one example of a non-abstract error.
export interface ServerErrorResult extends AbstractResultError<typeof ResultCodes.ServerError> {
  resultCode: typeof ResultCodes.ServerError;
  errorMessage: string;
  transient: true; // server errors are always transient
}

export function buildServerErrorResult(customErrorMessage?: string): ServerErrorResult {
  return {
    resultCode: ResultCodes.ServerError,
    errorMessage: customErrorMessage ?? "Server error",
    transient: true,
  } satisfies ServerErrorResult;
}
