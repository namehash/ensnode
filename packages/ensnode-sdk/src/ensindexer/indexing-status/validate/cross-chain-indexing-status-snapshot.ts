import { prettifyError } from "zod/v4";

import type { CrossChainIndexingStatusSnapshot } from "../cross-chain-indexing-status-snapshot";
import { makeCrossChainIndexingStatusSnapshotSchema } from "../schema/cross-chain-indexing-status-snapshot";

/**
 * Validate an {@link CrossChainIndexingStatusSnapshot} object.
 */
export function validateCrossChainIndexingStatusSnapshot(
  unvalidatedSnapshot: CrossChainIndexingStatusSnapshot,
  valueLabel?: string,
): CrossChainIndexingStatusSnapshot {
  const schema = makeCrossChainIndexingStatusSnapshotSchema(valueLabel);
  const parsed = schema.safeParse(unvalidatedSnapshot);
  if (parsed.error) {
    throw new Error(`Invalid CrossChainIndexingStatusSnapshot:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
