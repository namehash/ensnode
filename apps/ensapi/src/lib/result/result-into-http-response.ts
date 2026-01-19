import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import {
  buildResultInternalServerError,
  ResultCodes,
  type ResultServer,
  type ResultServerResultCode,
} from "@ensnode/ensnode-sdk";

import { makeLogger } from "@/lib/logger";

const logger = makeLogger("result-into-http-response");

/**
 * Get HTTP status code corresponding to the given operation result code.
 *
 * @param resultCode - The operation result code
 * @returns Corresponding HTTP status code
 * @throws Error if the result code is unhandled
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
    default:
      throw new Error(`Unhandled result code: ${resultCode}`);
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
  try {
    // Determine HTTP status code from result code
    const statusCode = resultCodeToHttpStatusCode(result.resultCode);

    // Return JSON response with appropriate status code
    return c.json(result, statusCode);
  } catch {
    // In case of unhandled result code, log error and
    // return response from internal server error result
    logger.error(`Unhandled result code encountered: ${result.resultCode}`);

    return resultIntoHttpResponse(
      c,
      buildResultInternalServerError("An internal server error occurred."),
    );
  }
}
