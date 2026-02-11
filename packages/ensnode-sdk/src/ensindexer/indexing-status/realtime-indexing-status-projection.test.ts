import { describe, expect, it } from "vitest";

import { earlierBlockRef, laterBlockRef } from "./block-refs.mock";
import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
} from "./chain-indexing-status-snapshot";
import { CrossChainIndexingStrategyIds } from "./cross-chain-indexing-status-snapshot";
import { deserializeCrossChainIndexingStatusSnapshot } from "./deserialize/cross-chain-indexing-status-snapshot";
import { OmnichainIndexingStatusIds } from "./omnichain-indexing-status-snapshot";
import {
  createRealtimeIndexingStatusProjection,
  type RealtimeIndexingStatusProjection,
} from "./realtime-indexing-status-projection";

describe("Realtime Indexing Status Projection", () => {
  it("can be created from existing omnichain snapshot", () => {
    // arrange
    const now = Math.floor(Date.now() / 1000);
    const snapshotTime = now - 20;
    const omnichainIndexingCursor = earlierBlockRef.timestamp;

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
    const projection = createRealtimeIndexingStatusProjection(snapshot, now);

    // assert
    expect(projection).toStrictEqual({
      projectedAt: now,
      worstCaseDistance: now - omnichainIndexingCursor,
      snapshot,
    } satisfies RealtimeIndexingStatusProjection);
  });
});
