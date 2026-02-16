import { prettifyError } from "zod/v4";

import type { RegistrarActionsResponse } from "./response";
import type { SerializedRegistrarActionsResponse } from "./serialized-response";
import { makeRegistrarActionsResponseSchema } from "./zod-schemas";

/**
 * Deserialize a {@link RegistrarActionsResponse} object.
 */
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
