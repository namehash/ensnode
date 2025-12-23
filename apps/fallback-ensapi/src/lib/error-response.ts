import type { Context } from "hono";
import type { ClientErrorStatusCode, ServerErrorStatusCode } from "hono/utils/http-status";

import type { ErrorResponse } from "@ensnode/ensnode-sdk";

// additional ErrorResponse details
const DETAILS = { isFallbackENSApi: true };

/**
 * Creates a standardized error response for the ENSApi.
 *
 * Handles different types of errors and converts them to appropriate HTTP responses
 * with consistent error formatting.
 *
 * @param c - Hono context object
 * @param options.error - The error input (ZodError, Error, string, or unknown)
 * @param options.status - The HTTP Status Code (Default 500)
 * @param options.details — Optional additional details in the ErrorResponse
 * @returns JSON error response with appropriate HTTP status code
 */
export const errorResponse = (
  c: Context,
  {
    error,
    status,
    details,
  }: {
    error: Error | string | unknown;
    status: ClientErrorStatusCode | ServerErrorStatusCode;
    details?: Record<string, unknown>;
  } = {
    error: "Internal Server Error",
    status: 500,
  },
) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Internal Server Error";

  return c.json(
    {
      message,
      details: {
        ...DETAILS,
        ...details,
      },
    } satisfies ErrorResponse,
    status,
  );
};
