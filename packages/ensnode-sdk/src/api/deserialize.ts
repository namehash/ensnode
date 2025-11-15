import { prettifyError } from "zod/v4";

import type {
  SerializedIndexingStatusResponse,
  SerializedRegistrarActionsResponse,
} from "./serialized-types";
import type { ErrorResponse, IndexingStatusResponse, RegistrarActionsResponse } from "./types";
import {
  ErrorResponseSchema,
  makeIndexingStatusResponseSchema,
  makeRegistrarActionsResponseSchema,
} from "./zod-schemas";

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

export function deserializeRegistrarActionsResponse(
  maybeResponse: SerializedRegistrarActionsResponse,
): RegistrarActionsResponse {
  const parsed = makeRegistrarActionsResponseSchema().safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize RegistrarActionsResponse:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
