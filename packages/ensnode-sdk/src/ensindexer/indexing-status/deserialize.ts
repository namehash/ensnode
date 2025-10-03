import { prettifyError } from "zod/v4";
import type {
  SerializedChainIndexingStatusSnapshot,
  SerializedCrossChainIndexingStatusSnapshot,
  SerializedOmnichainIndexingStatusSnapshot,
  SerializedRealtimeIndexingStatusProjection,
} from "./serialized-types";
import type {
  ChainIndexingStatusSnapshot,
  CrossChainIndexingStatusSnapshot,
  OmnichainIndexingStatusSnapshot,
  RealtimeIndexingStatusProjection,
} from "./types";
import {
  makeChainIndexingStatusSnapshotSchema,
  makeCrossChainIndexingStatusSnapshotSchema,
  makeOmnichainIndexingStatusSnapshotSchema,
  makeRealtimeIndexingStatusProjectionSchema,
} from "./zod-schemas";

/**
 * Deserialize into a {@link ChainIndexingSnapshot} object.
 */
export function deserializeChainIndexingStatusSnapshot(
  maybeSnapshot: SerializedChainIndexingStatusSnapshot,
  valueLabel?: string,
): ChainIndexingStatusSnapshot {
  const schema = makeChainIndexingStatusSnapshotSchema(valueLabel);
  const parsed = schema.safeParse(maybeSnapshot);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize into ChainIndexingStatusSnapshot:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

/**
 * Deserialize an {@link OmnichainIndexingStatusSnapshot} object.
 */
export function deserializeOmnichainIndexingStatusSnapshot(
  maybeSnapshot: SerializedOmnichainIndexingStatusSnapshot,
  valueLabel?: string,
): OmnichainIndexingStatusSnapshot {
  const schema = makeOmnichainIndexingStatusSnapshotSchema(valueLabel);
  const parsed = schema.safeParse(maybeSnapshot);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize into OmnichainIndexingStatusSnapshot:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

/**
 * Deserialize an {@link CrossChainIndexingStatusSnapshot} object.
 */
export function deserializeCrossChainIndexingStatusSnapshot(
  maybeSnapshot: SerializedCrossChainIndexingStatusSnapshot,
  valueLabel?: string,
): CrossChainIndexingStatusSnapshot {
  const schema = makeCrossChainIndexingStatusSnapshotSchema(valueLabel);
  const parsed = schema.safeParse(maybeSnapshot);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize into CrossChainIndexingStatusSnapshot:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

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
