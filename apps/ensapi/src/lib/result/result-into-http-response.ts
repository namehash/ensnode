import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { type AbstractResultOk, ResultCodes, type ResultServerError } from "@ensnode/ensnode-sdk";

export type OpResultServerOk<TData> = AbstractResultOk<TData>;

export type OpResultServer<TData = unknown> = OpResultServerOk<TData> | ResultServerError;

export type OpResultServerResultCode = OpResultServer["resultCode"];

/**
 * Get HTTP status code corresponding to the given operation result code.
 *
 * @param resultCode - The operation result code
 * @returns Corresponding HTTP status code
 */
export function resultCodeToHttpStatusCode(
  resultCode: OpResultServerResultCode,
): ContentfulStatusCode {
  switch (resultCode) {
    case ResultCodes.Ok:
      return 200;
    case ResultCodes.InvalidRequest:
      return 400;
    case ResultCodes.NotFound:
      return 404;
    case ResultCodes.InternalServerError:
      return 500;
    case ResultCodes.ServiceUnavailable:
      return 503;
  }
}

/**
 * Get an HTTP response from the given operation result.
 *
 * @param c - Hono context
 * @param result - The operation result
 * @returns HTTP response with appropriate status code and JSON body
 */
export function resultIntoHttpResponse<TResult extends OpResultServer>(
  c: Context,
  result: TResult,
): Response {
  const statusCode = resultCodeToHttpStatusCode(result.resultCode);

  return c.json(result, statusCode);
}
