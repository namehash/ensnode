import { prettifyError } from "zod/v4";

import type { CrossChainIndexingStatusSnapshot } from "./cross-chain-indexing-status-snapshot";
import type {
  SerializedCrossChainIndexingStatusSnapshot,
  SerializedRealtimeIndexingStatusProjection,
} from "./serialized-types";
import type { RealtimeIndexingStatusProjection } from "./types";
import {
  makeCrossChainIndexingStatusSnapshotSchema,
  makeRealtimeIndexingStatusProjectionSchema,
} from "./zod-schemas";

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
