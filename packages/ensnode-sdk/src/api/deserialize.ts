import { prettifyError } from "zod/v4";
import { SerializedIndexingStatusResponse } from "./serialized-types";
import type { ErrorResponse, IndexingStatusResponse } from "./types";
import { ErrorResponseSchema, makeIndexingStatusResponseSchema } from "./zod-schemas";

export function deserializeErrorResponse(maybeErrorResponse: unknown): ErrorResponse {
  const parsed = ErrorResponseSchema.safeParse(maybeErrorResponse);

  if (parsed.error) {
    throw new Error(`Cannot deserialize ErrorResponse:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}

export function deserializeIndexingStatusResponse(
  maybeResponse: SerializedIndexingStatusResponse,
): IndexingStatusResponse {
  const parsed = makeIndexingStatusResponseSchema().safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(`Cannot deserialize IndexingStatusResponse:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
