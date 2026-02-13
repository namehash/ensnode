import { prettifyError } from "zod/v4";

import type { ChainId, Unvalidated } from "../../../shared/types";
import type { ChainIndexingStatusSnapshot } from "../chain-indexing-status-snapshot";
import type { OmnichainIndexingStatusSnapshot } from "../omnichain-indexing-status-snapshot";
import type { SerializedOmnichainIndexingStatusSnapshot } from "../serialize/omnichain-indexing-status-snapshot";
import {
  makeOmnichainIndexingStatusSnapshotSchema,
  makeSerializedOmnichainIndexingStatusSnapshotSchema,
} from "../zod-schema/omnichain-indexing-status-snapshot";

/**
 * Builds an unvalidated {@link OmnichainIndexingStatusSnapshot} object to be
 * validated with {@link makeOmnichainIndexingStatusSnapshotSchema}.
 *
 * @param serializedSnapshot - The serialized snapshot to build from.
 * @return An unvalidated {@link OmnichainIndexingStatusSnapshot} object.
 */
export function buildUnvalidatedOmnichainIndexingStatusSnapshot(
  serializedSnapshot: SerializedOmnichainIndexingStatusSnapshot,
): Unvalidated<OmnichainIndexingStatusSnapshot> {
  const chains = new Map<Unvalidated<ChainId>, Unvalidated<ChainIndexingStatusSnapshot>>();

  for (const [chainIdString, chainIndexingStatusSnapshot] of Object.entries(
    serializedSnapshot.chains,
  )) {
    const chainId = Number(chainIdString) satisfies Unvalidated<ChainId>;

    chains.set(chainId, chainIndexingStatusSnapshot);
  }

  const unvalidatedSnapshot = {
    ...serializedSnapshot,
    chains,
  };

  return unvalidatedSnapshot;
}

/**
 * Deserialize an {@link OmnichainIndexingStatusSnapshot} object.
 */
export function deserializeOmnichainIndexingStatusSnapshot(
  data: Unvalidated<SerializedOmnichainIndexingStatusSnapshot>,
  valueLabel?: string,
): OmnichainIndexingStatusSnapshot {
  const schema = makeSerializedOmnichainIndexingStatusSnapshotSchema(valueLabel)
    .transform(buildUnvalidatedOmnichainIndexingStatusSnapshot)
    .pipe(makeOmnichainIndexingStatusSnapshotSchema(valueLabel));
  const parsed = schema.safeParse(data);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize into OmnichainIndexingStatusSnapshot:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}
