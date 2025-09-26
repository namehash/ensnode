import { describe, expect, it } from "vitest";
import { deserializeOmnichainIndexingSnapshot } from "./deserialize";
import { createProjection } from "./projection";
import { earlierBlockRef, laterBlockRef } from "./test-helpers";
import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  IndexingStrategyIds,
  OmnichainIndexingStatusIds,
} from "./types";

describe("Current Indexing Projection", () => {
  it("can be created from existing omnichain snapshot", () => {
    // arrange
    const now = Math.floor(Date.now() / 1000);
    const snapshotTime = now - 20;
    const omnichainIndexingCursor = now - 100;

    const snapshot = deserializeOmnichainIndexingSnapshot({
      omnichainStatus: OmnichainIndexingStatusIds.Following,
      chains: {
        "1": {
          status: ChainIndexingStatusIds.Following,
          config: {
            type: ChainIndexingConfigTypeIds.Indefinite,
            startBlock: earlierBlockRef,
          },
          latestIndexedBlock: earlierBlockRef,
          latestKnownBlock: laterBlockRef,
        },
      },
      omnichainIndexingCursor,
      snapshotTime,
    });

    // act
    const projection = createProjection(snapshot, now);

    // assert
    expect(projection).toStrictEqual({
      type: IndexingStrategyIds.Omnichain,
      realtime: now,
      maxRealtimeDistance: now - omnichainIndexingCursor,
      snapshot,
    });
  });

  it("can be created if omnichain snapshot was unavailable", () => {
    // arrange
    const now = Math.floor(Date.now() / 1000);
    const snapshot = null;

    // act
    const projection = createProjection(snapshot, now);

    // assert
    expect(projection).toStrictEqual({
      type: null,
      realtime: now,
      maxRealtimeDistance: null,
      snapshot,
    });
  });
});
