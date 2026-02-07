import { prettifyError } from "zod/v4";

import type { ChainIndexingStatusSnapshot } from "../chain-indexing-status-snapshot";
import type { SerializedChainIndexingStatusSnapshot } from "../serialize/chain-indexing-status-snapshot";
import { makeChainIndexingStatusSnapshotSchema } from "../validate/chain-indexing-status-snapshot";

/**
 * Deserialize into a {@link ChainIndexingStatusSnapshot} object.
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
