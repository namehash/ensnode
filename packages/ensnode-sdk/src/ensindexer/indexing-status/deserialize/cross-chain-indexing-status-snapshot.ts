import z, { prettifyError } from "zod/v4";

import { makeUnixTimestampSchema } from "../../../shared/zod-schemas";
import {
  type CrossChainIndexingStatusSnapshot,
  CrossChainIndexingStrategyIds,
} from "../cross-chain-indexing-status-snapshot";
import type { SerializedCrossChainIndexingStatusSnapshot } from "../serialize/cross-chain-indexing-status-snapshot";
import { makeCrossChainIndexingStatusSnapshotSchema } from "../validate/cross-chain-indexing-status-snapshot";
import {
  buildUnvalidatedOmnichainIndexingStatusSnapshot,
  makeSerializedOmnichainIndexingStatusSnapshotSchema,
} from "./omnichain-indexing-status-snapshot";

/**
 * Deserialize an {@link CrossChainIndexingStatusSnapshot} object.
 */
export function deserializeCrossChainIndexingStatusSnapshot(
  maybeSnapshot: SerializedCrossChainIndexingStatusSnapshot,
  valueLabel?: string,
): CrossChainIndexingStatusSnapshot {
  const schema = makeSerializedCrossChainIndexingStatusSnapshotSchema(valueLabel).pipe(
    z.preprocess(
      buildUnvalidatedCrossChainIndexingStatusSnapshot,
      makeCrossChainIndexingStatusSnapshotSchema(valueLabel),
    ),
  );
  const parsed = schema.safeParse(maybeSnapshot);

  if (parsed.error) {
    throw new Error(
      `Cannot deserialize into CrossChainIndexingStatusSnapshot:\n${prettifyError(parsed.error)}\n`,
    );
  }

  return parsed.data;
}

/**
 * Build unvalidated cross-chain indexing status snapshot to be validated.
 *
 * Return type is intentionally "unknown" to enforce validation by
 * {@link makeCrossChainIndexingStatusSnapshotSchema} call.
 */
export function buildUnvalidatedCrossChainIndexingStatusSnapshot(
  serializedCrossChainIndexingStatusSnapshot: SerializedCrossChainIndexingStatusSnapshot,
): unknown {
  const { strategy, slowestChainIndexingCursor, snapshotTime, omnichainSnapshot } =
    serializedCrossChainIndexingStatusSnapshot;

  return {
    strategy,
    slowestChainIndexingCursor,
    snapshotTime,
    omnichainSnapshot: buildUnvalidatedOmnichainIndexingStatusSnapshot(omnichainSnapshot),
  };
}

/**
 * Makes Zod schema for {@link SerializedCrossChainIndexingStatusSnapshot}
 */
export const makeSerializedCrossChainIndexingStatusSnapshotSchema = (
  valueLabel: string = "Cross-chain Indexing Status Snapshot",
) =>
  z.object({
    strategy: z.enum(CrossChainIndexingStrategyIds),
    slowestChainIndexingCursor: makeUnixTimestampSchema(valueLabel),
    snapshotTime: makeUnixTimestampSchema(valueLabel),
    omnichainSnapshot: makeSerializedOmnichainIndexingStatusSnapshotSchema(valueLabel),
  });
