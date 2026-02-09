import { prettifyError } from "zod/v4";

import type { ChainIndexingStatusSnapshot } from "../chain-indexing-status-snapshot";
import { makeChainIndexingStatusSnapshotSchema } from "../zod-schema/chain-indexing-status-snapshot";

/**
 * Validates a maybe {@link ChainIndexingStatusSnapshot} object.
 */
export function validateChainIndexingStatusSnapshot(
  unvalidatedSnapshot: ChainIndexingStatusSnapshot,
  valueLabel?: string,
): ChainIndexingStatusSnapshot {
  const schema = makeChainIndexingStatusSnapshotSchema(valueLabel);
  const parsed = schema.safeParse(unvalidatedSnapshot);

  if (parsed.error) {
    throw new Error(`Invalid ChainIndexingStatusSnapshot:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
