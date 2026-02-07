import { prettifyError, z } from "zod/v4";

import type { RealtimeIndexingStatusProjection } from "../realtime-indexing-status-projection";
import { buildUnvalidatedCrossChainIndexingStatusSnapshot } from "../schema/cross-chain-indexing-status-snapshot";
import {
  makeRealtimeIndexingStatusProjectionSchema,
  makeSerializedRealtimeIndexingStatusProjectionSchema,
} from "../schema/realtime-indexing-status-projection";
import type { SerializedRealtimeIndexingStatusProjection } from "../serialize/realtime-indexing-status-projection";

/**
 * Build unvalidated realtime indexing status projection to be validated.
 *
 * Return type is intentionally "unknown" to enforce validation by
 * {@link makeRealtimeIndexingStatusProjectionSchema} call.
 */
export function buildUnvalidatedRealtimeIndexingStatusProjection(
  serializedProjection: SerializedRealtimeIndexingStatusProjection,
): unknown {
  const { snapshot, projectedAt, worstCaseDistance } = serializedProjection;

  return {
    snapshot: buildUnvalidatedCrossChainIndexingStatusSnapshot(snapshot),
    projectedAt,
    worstCaseDistance,
  };
}

/**
 * Deserialize into a {@link RealtimeIndexingStatusProjection} object.
 */
export function deserializeRealtimeIndexingStatusProjection(
  maybeProjection: SerializedRealtimeIndexingStatusProjection,
  valueLabel?: string,
): RealtimeIndexingStatusProjection {
  const schema = makeSerializedRealtimeIndexingStatusProjectionSchema(valueLabel).pipe(
    z.preprocess(
      buildUnvalidatedRealtimeIndexingStatusProjection,
      makeRealtimeIndexingStatusProjectionSchema(valueLabel),
    ),
  );
  const parsed = schema.safeParse(maybeProjection);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize into RealtimeIndexingStatusProjection:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
