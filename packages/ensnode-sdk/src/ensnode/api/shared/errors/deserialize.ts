import { prettifyError } from "zod/v4";

import type { ErrorResponse } from "./response";
import { makeErrorResponseSchema } from "./zod-schemas";

/**
 * Deserialize a {@link ErrorResponse} object.
 */
export function deserializeErrorResponse(maybeErrorResponse: unknown): ErrorResponse {
  const parsed = makeErrorResponseSchema().safeParse(maybeErrorResponse);

  if (parsed.error) {
    throw new Error(`Cannot deserialize ErrorResponse:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
