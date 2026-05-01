import type { Context } from "hono";
import type { ClientErrorStatusCode, ServerErrorStatusCode } from "hono/utils/http-status";
import { ZodError } from "zod";

/**
 * Standardized error response shape for the ens-labels-collector.
 *
 * Mirrors the shape used elsewhere in the monorepo (see AGENTS.md "API boundaries").
 */
export type ErrorResponseBody = {
  message: string;
  details?: unknown;
};

type ErrorStatus = ClientErrorStatusCode | ServerErrorStatusCode;

/**
 * Sends a JSON error response with the canonical `{ message, details? }` shape.
 *
 * - `ZodError` becomes a 400 with `message: "Invalid Input"` and the flattened Zod issues as `details`.
 * - `Error` instances forward their `message`.
 * - Anything else becomes a generic `Internal Server Error`.
 */
type ErrorOptions =
  | { error: unknown; status?: ErrorStatus; details?: unknown }
  | { message: string; status: ErrorStatus; details?: unknown };

export function errorResponse(
  c: Context,
  options: ErrorOptions = { error: new Error("Internal Server Error"), status: 500 },
) {
  if ("message" in options) {
    const body: ErrorResponseBody = { message: options.message };
    if (options.details !== undefined) body.details = options.details;
    return c.json(body, options.status);
  }

  const { error } = options;
  let status: ErrorStatus = options.status ?? 500;
  let body: ErrorResponseBody;

  if (error instanceof ZodError) {
    status = 400;
    body = {
      message: "Invalid Input",
      details: options.details ?? error.flatten(),
    };
  } else if (error instanceof Error) {
    body = { message: error.message };
    if (options.details !== undefined) body.details = options.details;
  } else if (typeof error === "string") {
    body = { message: error };
    if (options.details !== undefined) body.details = options.details;
  } else {
    body = { message: "Internal Server Error" };
    if (options.details !== undefined) body.details = options.details;
  }

  return c.json(body, status);
}
