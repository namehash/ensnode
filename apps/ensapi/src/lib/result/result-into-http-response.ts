import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import { type AbstractResult, type ResultCodeServer, ResultCodes } from "@ensnode/ensnode-sdk";

/**
 * Mapping of ResultCodes to HTTP status codes.
 *
 * Used to determine the appropriate HTTP status code for a given operation
 * result.
 */
export const HTTP_STATUS_CODES = {
  [ResultCodes.Ok]: 200,
  [ResultCodes.InvalidRequest]: 400,
  [ResultCodes.NotFound]: 404,
  [ResultCodes.InternalServerError]: 500,
  [ResultCodes.ServiceUnavailable]: 503,
  [ResultCodes.InsufficientIndexingProgress]: 503,
} as const satisfies Record<ResultCodeServer, ContentfulStatusCode>;

/**
 * Get an HTTP response from the given operation result.
 *
 * @param c - Hono context
 * @param result - The operation result
 * @returns HTTP response with appropriate status code and JSON body
 */
export function resultIntoHttpResponse(
  c: Context,
  result: AbstractResult<ResultCodeServer>,
): Response {
  // Determine HTTP status code from result code
  const statusCode = HTTP_STATUS_CODES[result.resultCode];

  // Return JSON response with appropriate status code
  return c.json(result, statusCode);
}
