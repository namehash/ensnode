import { prettifyError } from "zod/v4";

import type { RegistrarActionsResponse } from "./response";
import type { SerializedRegistrarActionsResponse } from "./serialized-response";
import {
  makeRegistrarActionsResponseSchema,
  makeSerializedRegistrarActionsResponseSchema,
} from "./zod-schemas";

/**
 * Deserialize a {@link RegistrarActionsResponse} object.
 */
export function deserializeRegistrarActionsResponse(
  maybeResponse: SerializedRegistrarActionsResponse,
): RegistrarActionsResponse {
  const serialized = makeSerializedRegistrarActionsResponseSchema().safeParse(maybeResponse);

  if (serialized.error) {
    throw new Error(
      `Cannot deserialize RegistrarActionsResponse:\n${prettifyError(serialized.error)}\n`,
    );
  }

  const parsed = makeRegistrarActionsResponseSchema().safeParse(serialized.data);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize RegistrarActionsResponse:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
