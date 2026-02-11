/**
 * All zod schemas we define must remain internal implementation details.
 * We want the freedom to move away from zod in the future without impacting
 * any users of the ensnode-sdk package.
 *
 * The only way to share Zod schemas is to re-export them from
 * `./src/internal.ts` file.
 */
import { z } from "zod/v4";

import { makeDurationSchema, makeUnixTimestampSchema } from "../../shared/zod-schemas";
import {
  CrossChainIndexingStatusSnapshotOmnichain,
  CrossChainIndexingStrategyIds,
} from "./cross-chain-indexing-status-snapshot";
import {
  invariant_realtimeIndexingStatusProjectionProjectedAtIsAfterOrEqualToSnapshotTime,
  invariant_realtimeIndexingStatusProjectionWorstCaseDistanceIsCorrect,
  invariant_slowestChainEqualsToOmnichainSnapshotTime,
  invariant_snapshotTimeIsTheHighestKnownBlockTimestamp,
} from "./validations";
import { makeOmnichainIndexingStatusSnapshotSchema } from "./zod-schema/omnichain-indexing-status-snapshot";

/**
 * Makes Zod schema for {@link CrossChainIndexingStatusSnapshotOmnichain}
 */
const makeCrossChainIndexingStatusSnapshotOmnichainSchema = (
  valueLabel: string = "Cross-chain Indexing Status Snapshot Omnichain",
) =>
  z
    .strictObject({
      strategy: z.literal(CrossChainIndexingStrategyIds.Omnichain),
      slowestChainIndexingCursor: makeUnixTimestampSchema(valueLabel),
      snapshotTime: makeUnixTimestampSchema(valueLabel),
      omnichainSnapshot: makeOmnichainIndexingStatusSnapshotSchema(valueLabel),
    })
    .check(invariant_slowestChainEqualsToOmnichainSnapshotTime)
    .check(invariant_snapshotTimeIsTheHighestKnownBlockTimestamp);

/**
 * Makes Zod schema for {@link CrossChainIndexingStatusSnapshot}
 */
export const makeCrossChainIndexingStatusSnapshotSchema = (
  valueLabel: string = "Cross-chain Indexing Status Snapshot",
) =>
  z.discriminatedUnion("strategy", [
    makeCrossChainIndexingStatusSnapshotOmnichainSchema(valueLabel),
  ]);

/**
 * Makes Zod schema for {@link RealtimeIndexingStatusProjection}
 */
export const makeRealtimeIndexingStatusProjectionSchema = (
  valueLabel: string = "Realtime Indexing Status Projection",
) =>
  z
    .strictObject({
      projectedAt: makeUnixTimestampSchema(valueLabel),
      worstCaseDistance: makeDurationSchema(valueLabel),
      snapshot: makeCrossChainIndexingStatusSnapshotSchema(valueLabel),
    })
    .check(invariant_realtimeIndexingStatusProjectionProjectedAtIsAfterOrEqualToSnapshotTime)
    .check(invariant_realtimeIndexingStatusProjectionWorstCaseDistanceIsCorrect);
