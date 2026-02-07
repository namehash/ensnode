import { prettifyError, z } from "zod/v4";

import type { CrossChainIndexingStatusSnapshot } from "../cross-chain-indexing-status-snapshot";
import {
  buildUnvalidatedCrossChainIndexingStatusSnapshot,
  makeCrossChainIndexingStatusSnapshotSchema,
  makeSerializedCrossChainIndexingStatusSnapshotSchema,
} from "../schema/cross-chain-indexing-status-snapshot";
import type { SerializedCrossChainIndexingStatusSnapshot } from "../serialize/cross-chain-indexing-status-snapshot";

/**
 * Deserialize an {@link CrossChainIndexingStatusSnapshot} object.
 */
export function deserializeCrossChainIndexingStatusSnapshot(
  maybeSnapshot: SerializedCrossChainIndexingStatusSnapshot,
  valueLabel?: string,
): CrossChainIndexingStatusSnapshot {
  const schema = makeSerializedCrossChainIndexingStatusSnapshotSchema(valueLabel).pipe(
    z.preprocess(
      buildUnvalidatedCrossChainIndexingStatusSnapshot,
      makeCrossChainIndexingStatusSnapshotSchema(valueLabel),
    ),
  );
  const parsed = schema.safeParse(maybeSnapshot);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize into CrossChainIndexingStatusSnapshot:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
