import { prettifyError } from "zod/v4";

import type { RealtimeIndexingStatusProjection } from "../realtime-indexing-status-projection";
import { makeRealtimeIndexingStatusProjectionSchema } from "../schema/realtime-indexing-status-projection";

/**
 * Validate a {@link RealtimeIndexingStatusProjection} object.
 */
export function validateRealtimeIndexingStatusProjection(
  unvalidatedProjection: RealtimeIndexingStatusProjection,
  valueLabel?: string,
): RealtimeIndexingStatusProjection {
  const schema = makeRealtimeIndexingStatusProjectionSchema(valueLabel);
  const parsed = schema.safeParse(unvalidatedProjection);
  if (parsed.error) {
    throw new Error(`Invalid RealtimeIndexingStatusProjection:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
