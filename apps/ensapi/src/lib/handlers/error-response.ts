import type { Context } from "hono";
import type { ClientErrorStatusCode, ServerErrorStatusCode } from "hono/utils/http-status";
import { treeifyError, ZodError } from "zod/v4";

import type { ErrorResponse } from "@ensnode/ensnode-sdk";

/**
 * Represents a validation issue from the Standard Schema specification.
 * This is a subset of the StandardSchemaV1.Issue type used for validation errors.
 */
interface ValidationIssue {
  readonly message: string;
  readonly path?: readonly PropertyKey[];
}

/**
 * Type guard to check if input is a Standard Schema issues array
 */
const isStandardSchemaIssues = (input: unknown): input is readonly ValidationIssue[] => {
  return (
    Array.isArray(input) &&
    input.length > 0 &&
    typeof input[0] === "object" &&
    input[0] !== null &&
    "message" in input[0]
  );
};

/**
 * Creates a standardized error response for the ENSApi.
 *
 * Handles different types of errors and converts them to appropriate HTTP responses
 * with consistent error formatting. ZodErrors and Standard Schema validation issues
 * return 400 status codes with validation details, while other errors return 500
 * status codes.
 *
 * @param c - Hono context object
 * @param input - The error input (ZodError, ValidationIssue[], Error, string, or unknown)
 * @returns JSON error response with appropriate HTTP status code
 */
export const errorResponse = (
  c: Context,
  input: ZodError | readonly ValidationIssue[] | Error | string | unknown,
  statusCode: ClientErrorStatusCode | ServerErrorStatusCode = 500,
) => {
  if (input instanceof ZodError) {
    return c.json(
      { message: "Invalid Input", details: treeifyError(input) } satisfies ErrorResponse,
      400,
    );
  }

  if (isStandardSchemaIssues(input)) {
    // Convert Standard Schema issues to ZodError for consistent formatting
    const zodError = new ZodError(input as ZodError["issues"]);
    return c.json(
      { message: "Invalid Input", details: treeifyError(zodError) } satisfies ErrorResponse,
      400,
    );
  }

  if (input instanceof Error) {
    return c.json({ message: input.message } satisfies ErrorResponse, statusCode);
  }

  if (typeof input === "string") {
    return c.json({ message: input } satisfies ErrorResponse, statusCode);
  }

  return c.json({ message: "Internal Error" } satisfies ErrorResponse, statusCode);
};
