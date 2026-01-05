import { prettifyError } from "zod/v4";

import type { NameTokensResponse, SerializedNameTokensResponse } from "../name-tokens";
import { makeNameTokensResponseSchema } from "./zod-schemas";

/**
 * Deserialize a {@link NameTokensResponse} object.
 */
export function deserializedNameTokensResponse(
  maybeResponse: SerializedNameTokensResponse,
): NameTokensResponse {
  const parsed = makeNameTokensResponseSchema("Name Tokens Response", false).safeParse(
    maybeResponse,
  );

  if (parsed.error) {
    throw new Error(`Cannot deserialize NameTokensResponse:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
