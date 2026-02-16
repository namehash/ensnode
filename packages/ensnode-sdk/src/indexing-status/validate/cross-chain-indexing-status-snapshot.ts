import { prettifyError } from "zod/v4";

import type { Unvalidated } from "../../../shared/types";
import type { CrossChainIndexingStatusSnapshot } from "../cross-chain-indexing-status-snapshot";
import { makeCrossChainIndexingStatusSnapshotSchema } from "../zod-schema/cross-chain-indexing-status-snapshot";

/**
 * Validates a maybe {@link CrossChainIndexingStatusSnapshot} object.
 *
 * @throws Error if the provided object is not a valid {@link CrossChainIndexingStatusSnapshot}.
 */
export function validateCrossChainIndexingStatusSnapshot(
  unvalidatedSnapshot: Unvalidated<CrossChainIndexingStatusSnapshot>,
  valueLabel?: string,
): CrossChainIndexingStatusSnapshot {
  const schema = makeCrossChainIndexingStatusSnapshotSchema(valueLabel);
  const parsed = schema.safeParse(unvalidatedSnapshot);

  if (parsed.error) {
    throw new Error(`Invalid CrossChainIndexingStatusSnapshot:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
