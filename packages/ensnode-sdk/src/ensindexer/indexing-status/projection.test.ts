import { describe, expect, it } from "vitest";
import { deserializeCrossChainIndexingStatusSnapshot } from "./deserialize";
import { createRealtimeStatusProjection } from "./projection";
import { earlierBlockRef, laterBlockRef } from "./test-helpers";
import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  CrossChainIndexingStrategyIds,
  OmnichainIndexingStatusIds,
  RealtimeIndexingStatusProjection,
} from "./types";

describe("Realtime Indexing Status Projection", () => {
  it("can be created from existing omnichain snapshot", () => {
    // arrange
    const now = Math.floor(Date.now() / 1000);
    const snapshotTime = now - 20;
    const omnichainIndexingCursor = now - 100;

    const snapshot = deserializeCrossChainIndexingStatusSnapshot({
      strategy: CrossChainIndexingStrategyIds.Omnichain,
      slowestChainIndexingCursor: omnichainIndexingCursor,
      snapshotTime,
      omnichainSnapshot: {
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        chains: {
          "1": {
            chainStatus: ChainIndexingStatusIds.Following,
            config: {
              configType: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: earlierBlockRef,
            },
            latestIndexedBlock: earlierBlockRef,
            latestKnownBlock: laterBlockRef,
          },
        },
        omnichainIndexingCursor,
      },
    });

    // act
    const projection = createRealtimeStatusProjection(snapshot, now);

    // assert
    expect(projection).toStrictEqual({
      projectedAt: now,
      worstCaseDistance: now - omnichainIndexingCursor,
      snapshot,
    } satisfies RealtimeIndexingStatusProjection);
  });
});
