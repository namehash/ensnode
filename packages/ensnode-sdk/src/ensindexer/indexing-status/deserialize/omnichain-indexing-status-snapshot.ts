import { prettifyError, z } from "zod/v4";

import type { OmnichainIndexingStatusSnapshot } from "../omnichain-indexing-status-snapshot";
import {
  buildUnvalidatedOmnichainIndexingStatusSnapshot,
  makeOmnichainIndexingStatusSnapshotSchema,
  makeSerializedOmnichainIndexingStatusSnapshotSchema,
} from "../schema/omnichian-indexing-status-snapshot";
import type { SerializedOmnichainIndexingStatusSnapshot } from "../serialize/omnichain-indexing-status-snapshot";

/**
 * Deserialize an {@link OmnichainIndexingStatusSnapshot} object.
 */
export function deserializeOmnichainIndexingStatusSnapshot(
  maybeSnapshot: SerializedOmnichainIndexingStatusSnapshot,
  valueLabel?: string,
): OmnichainIndexingStatusSnapshot {
  const schema = makeSerializedOmnichainIndexingStatusSnapshotSchema(valueLabel).pipe(
    z.preprocess(
      buildUnvalidatedOmnichainIndexingStatusSnapshot,
      makeOmnichainIndexingStatusSnapshotSchema(valueLabel),
    ),
  );
  const parsed = schema.safeParse(maybeSnapshot);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize into OmnichainIndexingStatusSnapshot:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
