import { prettifyError } from "zod/v4";

import type { SerializedRealtimeIndexingStatusProjection } from "./serialized-types";
import type { RealtimeIndexingStatusProjection } from "./types";
import { makeRealtimeIndexingStatusProjectionSchema } from "./zod-schemas";

/**
 * Deserialize into a {@link RealtimeIndexingStatusProjection} object.
 */
export function deserializeRealtimeIndexingStatusProjection(
  maybeProjection: SerializedRealtimeIndexingStatusProjection,
  valueLabel?: string,
): RealtimeIndexingStatusProjection {
  const schema = makeRealtimeIndexingStatusProjectionSchema(valueLabel);
  const parsed = schema.safeParse(maybeProjection);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize into RealtimeIndexingStatusProjection:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
