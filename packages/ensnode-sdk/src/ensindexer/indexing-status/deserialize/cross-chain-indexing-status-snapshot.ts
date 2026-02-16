import { prettifyError } from "zod/v4";

import type { Unvalidated } from "../../../shared/types";
import type { CrossChainIndexingStatusSnapshot } from "../cross-chain-indexing-status-snapshot";
import type { SerializedCrossChainIndexingStatusSnapshot } from "../serialize/cross-chain-indexing-status-snapshot";
import {
  makeCrossChainIndexingStatusSnapshotSchema,
  makeSerializedCrossChainIndexingStatusSnapshotSchema,
} from "../zod-schema/cross-chain-indexing-status-snapshot";
import { buildUnvalidatedOmnichainIndexingStatusSnapshot } from "./omnichain-indexing-status-snapshot";

/**
 * Builds an unvalidated {@link CrossChainIndexingStatusSnapshot} object to be
 * validated with {@link makeCrossChainIndexingStatusSnapshotSchema}.
 *
 * @param serializedSnapshot - The serialized snapshot to build from.
 * @return An unvalidated {@link CrossChainIndexingStatusSnapshot} object.
 */
export function buildUnvalidatedCrossChainIndexingStatusSnapshot(
  serializedSnapshot: SerializedCrossChainIndexingStatusSnapshot,
): Unvalidated<CrossChainIndexingStatusSnapshot> {
  return {
    ...serializedSnapshot,
    omnichainSnapshot: buildUnvalidatedOmnichainIndexingStatusSnapshot(
      serializedSnapshot.omnichainSnapshot,
    ),
  };
}

/**
 * Deserialize an {@link CrossChainIndexingStatusSnapshot} object.
 */
export function deserializeCrossChainIndexingStatusSnapshot(
  maybeSnapshot: Unvalidated<SerializedCrossChainIndexingStatusSnapshot>,
  valueLabel?: string,
): CrossChainIndexingStatusSnapshot {
  const schema = makeSerializedCrossChainIndexingStatusSnapshotSchema(valueLabel)
    .transform(buildUnvalidatedCrossChainIndexingStatusSnapshot)
    .pipe(makeCrossChainIndexingStatusSnapshotSchema(valueLabel));
  const parsed = schema.safeParse(maybeSnapshot);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize into CrossChainIndexingStatusSnapshot:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
