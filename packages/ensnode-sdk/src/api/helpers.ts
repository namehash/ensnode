import { prettifyError } from "zod/v4";
import { ErrorResponse } from "./types";
import { ErrorResponseSchema } from "./zod-schemas";

export function deserializeErrorResponse(maybeErrorResponse: unknown): ErrorResponse {
  const parsed = ErrorResponseSchema.safeParse(maybeErrorResponse);

  if (parsed.error) {
    throw new Error(`Cannot deserialize ErrorResponse:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
