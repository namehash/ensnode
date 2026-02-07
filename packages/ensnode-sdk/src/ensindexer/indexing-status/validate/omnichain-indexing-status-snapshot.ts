import { prettifyError } from "zod/v4";

import type { OmnichainIndexingStatusSnapshot } from "../omnichain-indexing-status-snapshot";
import { makeOmnichainIndexingStatusSnapshotSchema } from "../schema/omnichian-indexing-status-snapshot";

/**
 * Validate an {@link OmnichainIndexingStatusSnapshot} object.
 */
export function validateOmnichainIndexingStatusSnapshot(
  unvalidatedSnapshot: OmnichainIndexingStatusSnapshot,
  valueLabel?: string,
): OmnichainIndexingStatusSnapshot {
  const schema = makeOmnichainIndexingStatusSnapshotSchema(valueLabel);
  const parsed = schema.safeParse(unvalidatedSnapshot);
  if (parsed.error) {
    throw new Error(`Invalid OmnichainIndexingStatusSnapshot:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
