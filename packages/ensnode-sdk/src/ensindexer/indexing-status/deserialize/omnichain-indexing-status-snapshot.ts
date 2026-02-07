import z, { prettifyError } from "zod/v4";

import { deserializeChainId } from "../../../shared/deserialize";
import type { ChainIdString } from "../../../shared/serialized-types";
import type { ChainId } from "../../../shared/types";
import { makeChainIdStringSchema, makeUnixTimestampSchema } from "../../../shared/zod-schemas";
import type {
  ChainIndexingStatusSnapshot,
  ChainIndexingStatusSnapshotCompleted,
  ChainIndexingStatusSnapshotQueued,
} from "../chain-indexing-status-snapshot";
import {
  type ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill,
  OmnichainIndexingStatusIds,
  type OmnichainIndexingStatusSnapshot,
} from "../omnichain-indexing-status-snapshot";
import type { SerializedChainIndexingStatusSnapshot } from "../serialize/chain-indexing-status-snapshot";
import type {
  SerializedOmnichainIndexingStatusSnapshot,
  SerializedOmnichainIndexingStatusSnapshotBackfill,
  SerializedOmnichainIndexingStatusSnapshotCompleted,
  SerializedOmnichainIndexingStatusSnapshotUnstarted,
} from "../serialize/omnichain-indexing-status-snapshot";
import { makeChainIndexingStatusSnapshotSchema } from "../validate/chain-indexing-status-snapshot";
import { makeOmnichainIndexingStatusSnapshotSchema } from "../validate/omnichain-indexing-status-snapshot";

/**
 * Build unvalidated omnichain indexing status snapshot to be validated.
 *
 * Return type is intentionally "unknown" to enforce validation by
 * {@link makeOmnichainIndexingStatusSnapshotSchema} call.
 */
export function buildUnvalidatedOmnichainIndexingStatusSnapshot(
  serializedOmnichainIndexingStatusSnapshot: SerializedOmnichainIndexingStatusSnapshot,
): unknown {
  const { omnichainStatus, chains, omnichainIndexingCursor } =
    serializedOmnichainIndexingStatusSnapshot;

  switch (omnichainStatus) {
    case OmnichainIndexingStatusIds.Unstarted: {
      return {
        omnichainStatus,
        chains: buildUnvalidatedChainIndexingStatuses(chains) as Map<
          ChainId,
          ChainIndexingStatusSnapshotQueued
        >,
        omnichainIndexingCursor,
      };
    }

    case OmnichainIndexingStatusIds.Backfill: {
      return {
        omnichainStatus,
        chains: buildUnvalidatedChainIndexingStatuses(chains) as Map<
          ChainId,
          ChainIndexingStatusSnapshotForOmnichainIndexingStatusSnapshotBackfill
        >,
        omnichainIndexingCursor,
      };
    }

    case OmnichainIndexingStatusIds.Following: {
      return {
        omnichainStatus,
        chains: buildUnvalidatedChainIndexingStatuses(chains),
        omnichainIndexingCursor,
      };
    }

    case OmnichainIndexingStatusIds.Completed: {
      return {
        omnichainStatus,
        chains: buildUnvalidatedChainIndexingStatuses(chains) as Map<
          ChainId,
          ChainIndexingStatusSnapshotCompleted
        >,
        omnichainIndexingCursor,
      };
    }
  }
}

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

/**
 * Build unvalidated chain indexing statuses map to be validated by
 * {@link makeChainIndexingStatusesSchema} call.
 */
export function buildUnvalidatedChainIndexingStatuses(
  serializedChainIndexingStatuses: Record<ChainIdString, SerializedChainIndexingStatusSnapshot>,
): Map<ChainId, ChainIndexingStatusSnapshot> {
  const chainIndexingStatuses = new Map<ChainId, ChainIndexingStatusSnapshot>();

  for (const [serializedChainId, chainIndexingSnapshot] of Object.entries(
    serializedChainIndexingStatuses,
  )) {
    const chainId = deserializeChainId(serializedChainId);

    chainIndexingStatuses.set(chainId, chainIndexingSnapshot);
  }

  return chainIndexingStatuses;
}

const makeSerializedChainIndexingStatusSnapshotsSchema = (valueLabel: string = "Value") =>
  z.record(makeChainIdStringSchema(), makeChainIndexingStatusSnapshotSchema(valueLabel));

/**
 * Makes Zod schema for {@link SerializedOmnichainIndexingStatusSnapshotUnstarted}
 */
const makeSerializedOmnichainIndexingStatusSnapshotUnstartedSchema = (valueLabel?: string) =>
  z.strictObject({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Unstarted),
    chains: makeSerializedChainIndexingStatusSnapshotsSchema(valueLabel),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
  });

/**
 * Makes Zod schema for {@link SerializedOmnichainIndexingStatusSnapshotBackfill}
 */
const makeSerializedOmnichainIndexingStatusSnapshotBackfillSchema = (valueLabel?: string) =>
  z.strictObject({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Backfill),
    chains: makeSerializedChainIndexingStatusSnapshotsSchema(valueLabel),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
  });

/**
 * Makes Zod schema for {@link SerializedOmnichainIndexingStatusSnapshotCompleted}
 */
const makeSerializedOmnichainIndexingStatusSnapshotCompletedSchema = (valueLabel?: string) =>
  z.strictObject({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Completed),
    chains: makeSerializedChainIndexingStatusSnapshotsSchema(valueLabel),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
  });

/**
 * Makes Zod schema for {@link SerializedOmnichainIndexingStatusSnapshotFollowing}
 */
const makeSerializedOmnichainIndexingStatusSnapshotFollowingSchema = (valueLabel?: string) =>
  z.strictObject({
    omnichainStatus: z.literal(OmnichainIndexingStatusIds.Following),
    chains: makeSerializedChainIndexingStatusSnapshotsSchema(valueLabel),
    omnichainIndexingCursor: makeUnixTimestampSchema(valueLabel),
  });

/**
 * Makes Zod schema for {@link SerializedOmnichainIndexingStatusSnapshot}.
 */
export const makeSerializedOmnichainIndexingStatusSnapshotSchema = (valueLabel: string = "Value") =>
  z.discriminatedUnion("omnichainStatus", [
    makeSerializedOmnichainIndexingStatusSnapshotUnstartedSchema(valueLabel),
    makeSerializedOmnichainIndexingStatusSnapshotBackfillSchema(valueLabel),
    makeSerializedOmnichainIndexingStatusSnapshotCompletedSchema(valueLabel),
    makeSerializedOmnichainIndexingStatusSnapshotFollowingSchema(valueLabel),
  ]);
