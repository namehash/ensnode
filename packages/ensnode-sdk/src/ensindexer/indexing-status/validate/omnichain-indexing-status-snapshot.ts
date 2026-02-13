import { prettifyError } from "zod/v4";

import type { Unvalidated } from "../../../shared/types";
import type { OmnichainIndexingStatusSnapshot } from "../omnichain-indexing-status-snapshot";
import { makeOmnichainIndexingStatusSnapshotSchema } from "../zod-schema/omnichain-indexing-status-snapshot";

/**
 * Validates a maybe {@link OmnichainIndexingStatusSnapshot} object.
 *
 * @throws Error if the provided object is not a valid {@link OmnichainIndexingStatusSnapshot}.
 */
export function validateOmnichainIndexingStatusSnapshot(
  unvalidatedSnapshot: Unvalidated<OmnichainIndexingStatusSnapshot>,
  valueLabel?: string,
): OmnichainIndexingStatusSnapshot {
  const schema = makeOmnichainIndexingStatusSnapshotSchema(valueLabel);
  const parsed = schema.safeParse(unvalidatedSnapshot);
  if (parsed.error) {
    throw new Error(`Invalid OmnichainIndexingStatusSnapshot:\n${prettifyError(parsed.error)}\n`);
  }

  return parsed.data;
}
