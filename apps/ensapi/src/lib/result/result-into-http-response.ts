import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { ResultCodes, type ResultServer, type ResultServerResultCode } from "@ensnode/ensnode-sdk";

/**
 * Get HTTP status code corresponding to the given operation result code.
 *
 * @param resultCode - The operation result code
 * @returns Corresponding HTTP status code
 */
export function resultCodeToHttpStatusCode(
  resultCode: ResultServerResultCode,
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
export function resultIntoHttpResponse<TResult extends ResultServer>(
  c: Context,
  result: TResult,
): Response {
  const statusCode = resultCodeToHttpStatusCode(result.resultCode);

  return c.json(result, statusCode);
}
