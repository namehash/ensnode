import { z } from "zod/v4";

import { makeUnixTimestampSchema } from "../../../shared/zod-schemas";
import { CrossChainIndexingStrategyIds } from "../cross-chain-indexing-status-snapshot";
import {
  invariant_slowestChainEqualsToOmnichainSnapshotTime,
  invariant_snapshotTimeIsTheHighestKnownBlockTimestamp,
} from "../validations";
import { makeOmnichainIndexingStatusSnapshotSchema } from "./omnichain-indexing-status-snapshot";

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
