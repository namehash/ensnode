import { prettifyError } from "zod/v4";

import type { Unvalidated } from "../../../shared/types";
import type { RealtimeIndexingStatusProjection } from "../realtime-indexing-status-projection";
import type { SerializedRealtimeIndexingStatusProjection } from "../serialize/realtime-indexing-status-projection";
import {
  makeRealtimeIndexingStatusProjectionSchema,
  makeSerializedRealtimeIndexingStatusProjectionSchema,
} from "../zod-schema/realtime-indexing-status-projection";
import { buildUnvalidatedCrossChainIndexingStatusSnapshot } from "./cross-chain-indexing-status-snapshot";

/**
 * Builds an unvalidated {@link RealtimeIndexingStatusProjection} object to be
 * validated with {@link makeRealtimeIndexingStatusProjectionSchema}.
 *
 * @param serializedProjection - The serialized projection to build from.
 * @return An unvalidated {@link RealtimeIndexingStatusProjection} object.
 */
export function buildUnvalidatedRealtimeIndexingStatusProjection(
  serializedProjection: SerializedRealtimeIndexingStatusProjection,
): Unvalidated<RealtimeIndexingStatusProjection> {
  return {
    ...serializedProjection,
    snapshot: buildUnvalidatedCrossChainIndexingStatusSnapshot(serializedProjection.snapshot),
  };
}

/**
 * Deserialize into a {@link RealtimeIndexingStatusProjection} object.
 */
export function deserializeRealtimeIndexingStatusProjection(
  maybeProjection: SerializedRealtimeIndexingStatusProjection,
  valueLabel?: string,
): RealtimeIndexingStatusProjection {
  const schema = makeSerializedRealtimeIndexingStatusProjectionSchema(valueLabel)
    .transform(buildUnvalidatedRealtimeIndexingStatusProjection)
    .pipe(makeRealtimeIndexingStatusProjectionSchema(valueLabel));
  const parsed = schema.safeParse(maybeProjection);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize into RealtimeIndexingStatusProjection:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
