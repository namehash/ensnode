import { prettifyError } from "zod/v4";

import type { Unvalidated } from "../../shared/types";
import type { RealtimeIndexingStatusProjection } from "../realtime-indexing-status-projection";
import { makeRealtimeIndexingStatusProjectionSchema } from "../zod-schema/realtime-indexing-status-projection";

/**
 * Validates a maybe {@link RealtimeIndexingStatusProjection} object.
 *
 * @throws Error if the provided object is not a valid {@link RealtimeIndexingStatusProjection}.
 */
export function validateRealtimeIndexingStatusProjection(
  unvalidatedProjection: Unvalidated<RealtimeIndexingStatusProjection>,
  valueLabel?: string,
): RealtimeIndexingStatusProjection {
  const schema = makeRealtimeIndexingStatusProjectionSchema(valueLabel);
  const parsed = schema.safeParse(unvalidatedProjection);

  if (parsed.error) {
    throw new Error(`Invalid RealtimeIndexingStatusProjection:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
