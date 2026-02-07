import { prettifyError, z } from "zod/v4";

import { makeDurationSchema, makeUnixTimestampSchema } from "../../../shared/zod-schemas";
import type { RealtimeIndexingStatusProjection } from "../realtime-indexing-status-projection";
import type { SerializedRealtimeIndexingStatusProjection } from "../serialize/realtime-indexing-status-projection";
import { makeRealtimeIndexingStatusProjectionSchema } from "../validate/realtime-indexing-status-projection";
import {
  buildUnvalidatedCrossChainIndexingStatusSnapshot,
  makeSerializedCrossChainIndexingStatusSnapshotSchema,
} from "./cross-chain-indexing-status-snapshot";

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

/**
 * Makes Zod schema for {@link SerializedRealtimeIndexingStatusProjection}.
 */
export const makeSerializedRealtimeIndexingStatusProjectionSchema = (
  valueLabel: string = "Value",
) =>
  z.strictObject({
    snapshot: makeSerializedCrossChainIndexingStatusSnapshotSchema(valueLabel),
    projectedAt: makeUnixTimestampSchema(valueLabel),
    worstCaseDistance: makeDurationSchema(valueLabel),
  });
