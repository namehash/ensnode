import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshotBackfill,
  type ChainIndexingStatusSnapshotFollowing,
  type CrossChainIndexingStatusSnapshot,
  createRealtimeIndexingStatusProjection,
  OmnichainIndexingStatusIds,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";

export const arrangeMockedIndexingStatusVar = ({
  now,
  slowestChainIndexingCursor,
  omnichainStatus,
}: {
  now: UnixTimestamp;
  slowestChainIndexingCursor: UnixTimestamp;
  omnichainStatus:
    | typeof OmnichainIndexingStatusIds.Backfill
    | typeof OmnichainIndexingStatusIds.Following;
}) => {
  const omnichainStatuses = {
    [OmnichainIndexingStatusIds.Backfill]: {
      omnichainStatus: OmnichainIndexingStatusIds.Backfill,
      omnichainIndexingCursor: slowestChainIndexingCursor,
      chains: new Map([
        [
          1,
          {
            chainStatus: ChainIndexingStatusIds.Backfill,
            latestIndexedBlock: {
              timestamp: now - 10,
              number: 149,
            },
            backfillEndBlock: {
              timestamp: now - 5,
              number: 150,
            },
            config: {
              configType: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: {
                number: 100,
                timestamp: now - 1000,
              },
            },
          } satisfies ChainIndexingStatusSnapshotBackfill,
        ],
      ]),
    } as CrossChainIndexingStatusSnapshot["omnichainSnapshot"],

    [OmnichainIndexingStatusIds.Following]: {
      omnichainStatus: OmnichainIndexingStatusIds.Following,
      omnichainIndexingCursor: slowestChainIndexingCursor,
      chains: new Map([
        [
          1,
          {
            chainStatus: ChainIndexingStatusIds.Following,
            latestIndexedBlock: {
              timestamp: now - 10,
              number: 150,
            },
            latestKnownBlock: {
              timestamp: now,
              number: 151,
            },
            config: {
              configType: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: {
                number: 100,
                timestamp: now - 1000,
              },
            },
          } satisfies ChainIndexingStatusSnapshotFollowing,
        ],
      ]),
    } as CrossChainIndexingStatusSnapshot["omnichainSnapshot"],
  };

  const indexingStatus = {
    omnichainSnapshot: omnichainStatuses[omnichainStatus],
    snapshotTime: now,
    slowestChainIndexingCursor,
  } satisfies Pick<
    CrossChainIndexingStatusSnapshot,
    "omnichainSnapshot" | "slowestChainIndexingCursor" | "snapshotTime"
  > as CrossChainIndexingStatusSnapshot;

  const realtimeProjection = createRealtimeIndexingStatusProjection(indexingStatus, now);

  return realtimeProjection;
};
