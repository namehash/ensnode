import { prettifyError } from "zod/v4";

import type { IndexingStatusResponse } from "./response";
import type { SerializedIndexingStatusResponse } from "./serialized-response";
import { makeIndexingStatusResponseSchema } from "./zod-schemas";

/**
 * Deserialize a {@link IndexingStatusResponse} object.
 */
export function deserializeIndexingStatusResponse(
  maybeResponse: SerializedIndexingStatusResponse,
): IndexingStatusResponse {
  const parsed = makeIndexingStatusResponseSchema().safeParse(maybeResponse);

  if (parsed.error) {
    throw new Error(`Cannot deserialize IndexingStatusResponse:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
