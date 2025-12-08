import type { Context } from "hono";
import { treeifyError, ZodError } from "zod/v4";

import type { ErrorResponse } from "@ensnode/ensnode-sdk";

/**
 * Creates a standardized error response for the ENSApi.
 *
 * Handles different types of errors and converts them to appropriate HTTP responses
 * with consistent error formatting. ZodErrors return 400 status codes with validation
 * details, while other errors return 500 status codes.
 *
 * @param c - Hono context object
 * @param input - The error input (ZodError, Error, string, or unknown)
 * @returns JSON error response with appropriate HTTP status code
 */
export const errorResponse = (c: Context, input: ZodError | Error | string | unknown) => {
  if (input instanceof ZodError) {
    return c.json(
      { message: "Invalid Input", details: treeifyError(input) } satisfies ErrorResponse,
      400,
    );
  }

  if (input instanceof Error) {
    return c.json({ message: input.message } satisfies ErrorResponse, 500);
  }

  if (typeof input === "string") {
    return c.json({ message: input } satisfies ErrorResponse, 500);
  }

  return c.json({ message: "Internal Error" } satisfies ErrorResponse, 500);
};
