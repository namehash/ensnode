import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  CrossChainIndexingStrategyIds,
  IndexingStatusResponse,
  IndexingStatusResponseCodes,
  IndexingStatusResponseError,
  OmnichainIndexingStatusId,
  OmnichainIndexingStatusIds,
  SerializedChainIndexingStatusSnapshotBackfill,
  SerializedChainIndexingStatusSnapshotCompleted,
  SerializedChainIndexingStatusSnapshotFollowing,
  SerializedChainIndexingStatusSnapshotQueued,
  SerializedOmnichainIndexingStatusSnapshotBackfill,
  SerializedOmnichainIndexingStatusSnapshotCompleted,
  SerializedOmnichainIndexingStatusSnapshotFollowing,
  SerializedOmnichainIndexingStatusSnapshotUnstarted,
  deserializeIndexingStatusResponse,
} from "@ensnode/ensnode-sdk";

export const indexingStatusResponseError: IndexingStatusResponseError = {
  responseCode: IndexingStatusResponseCodes.Error,
};

export const indexingStatusResponseOkOmnichain: Record<
  OmnichainIndexingStatusId,
  IndexingStatusResponse
> = {
  [OmnichainIndexingStatusIds.Unstarted]: deserializeIndexingStatusResponse({
    responseCode: IndexingStatusResponseCodes.Ok,
    realtimeProjection: {
      projectedAt: 1759409669,
      worstCaseDistance: 38_640_678,
      snapshot: {
        strategy: CrossChainIndexingStrategyIds.Omnichain,
        slowestChainIndexingCursor: 1720768991,
        snapshotTime: 1759409667,
        omnichainSnapshot: {
          omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
          omnichainIndexingCursor: 1720768991,
          chains: {
            "1": {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1759409665,
                  number: 3327417,
                },
                endBlock: null,
              },
            } satisfies SerializedChainIndexingStatusSnapshotQueued,

            "10": {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1731834595,
                  number: 110393959,
                },
                endBlock: null,
              },
            } satisfies SerializedChainIndexingStatusSnapshotQueued,
            "8453": {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1721834595,
                  number: 17522624,
                },
                endBlock: null,
              },
            } satisfies SerializedChainIndexingStatusSnapshotQueued,

            "59144": {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1720768992,
                  number: 6682888,
                },
                endBlock: null,
              },
            } satisfies SerializedChainIndexingStatusSnapshotQueued,
          },
        } satisfies SerializedOmnichainIndexingStatusSnapshotUnstarted,
      },
    },
  }),

  [OmnichainIndexingStatusIds.Backfill]: deserializeIndexingStatusResponse({
    responseCode: IndexingStatusResponseCodes.Ok,
    realtimeProjection: {
      projectedAt: 1759409670,
      worstCaseDistance: 178510009,
      snapshot: {
        strategy: CrossChainIndexingStrategyIds.Omnichain,
        slowestChainIndexingCursor: 1580899661,
        snapshotTime: 1759409668,
        omnichainSnapshot: {
          omnichainStatus: OmnichainIndexingStatusIds.Backfill,
          omnichainIndexingCursor: 1580899661,
          chains: {
            "1": {
              chainStatus: ChainIndexingStatusIds.Backfill,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1489165544,
                  number: 3327417,
                },
                endBlock: null,
              },
              latestIndexedBlock: {
                timestamp: 1580899661,
                number: 9422161,
              },
              backfillEndBlock: {
                timestamp: 1755622079,
                number: 23176411,
              },
            } satisfies SerializedChainIndexingStatusSnapshotBackfill,

            "10": {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1696386695,
                  number: 110393959,
                },
                endBlock: null,
              },
            } satisfies SerializedChainIndexingStatusSnapshotQueued,
            "8453": {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1721834595,
                  number: 17522624,
                },
                endBlock: null,
              },
            } satisfies SerializedChainIndexingStatusSnapshotQueued,
            "59144": {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1720768992,
                  number: 6682888,
                },
                endBlock: null,
              },
            } satisfies SerializedChainIndexingStatusSnapshotQueued,
            "567": {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1720768999,
                  number: 6682889,
                },
                endBlock: null,
              },
            } satisfies SerializedChainIndexingStatusSnapshotQueued,
          },
        } satisfies SerializedOmnichainIndexingStatusSnapshotBackfill,
      },
    },
  }),

  [OmnichainIndexingStatusIds.Following]: deserializeIndexingStatusResponse({
    responseCode: IndexingStatusResponseCodes.Ok,
    realtimeProjection: {
      projectedAt: 1755667460,
      worstCaseDistance: 9,
      snapshot: {
        strategy: CrossChainIndexingStrategyIds.Omnichain,
        slowestChainIndexingCursor: 1755667451,
        snapshotTime: 1755667453,
        omnichainSnapshot: {
          omnichainStatus: OmnichainIndexingStatusIds.Following,
          omnichainIndexingCursor: 1755667451,
          chains: {
            "1": {
              chainStatus: ChainIndexingStatusIds.Following,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1489165544,
                  number: 3327417,
                },
              },
              latestIndexedBlock: {
                timestamp: 1755667451,
                number: 23180178,
              },
              latestKnownBlock: {
                timestamp: 1755667451,
                number: 23180178,
              },
            } satisfies SerializedChainIndexingStatusSnapshotFollowing,
            "10": {
              chainStatus: ChainIndexingStatusIds.Following,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1696386695,
                  number: 110393959,
                },
              },
              latestIndexedBlock: {
                timestamp: 1755667449,
                number: 140034336,
              },
              latestKnownBlock: {
                timestamp: 1755667451,
                number: 140034337,
              },
            } satisfies SerializedChainIndexingStatusSnapshotFollowing,

            "8453": {
              chainStatus: ChainIndexingStatusIds.Following,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1721834595,
                  number: 17522624,
                },
              },
              latestIndexedBlock: {
                timestamp: 1755667449,
                number: 34439051,
              },
              latestKnownBlock: {
                timestamp: 1755667451,
                number: 34439052,
              },
            } satisfies SerializedChainIndexingStatusSnapshotFollowing,

            "59144": {
              chainStatus: ChainIndexingStatusIds.Following,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1720768992,
                  number: 6682888,
                },
              },
              latestIndexedBlock: {
                timestamp: 1755667449,
                number: 22269913,
              },
              latestKnownBlock: {
                timestamp: 1755667451,
                number: 22269914,
              },
            } satisfies SerializedChainIndexingStatusSnapshotFollowing,
          },
        } satisfies SerializedOmnichainIndexingStatusSnapshotFollowing,
      },
    },
  }),

  [OmnichainIndexingStatusIds.Completed]: deserializeIndexingStatusResponse({
    responseCode: IndexingStatusResponseCodes.Ok,
    realtimeProjection: {
      projectedAt: 1689337668,
      worstCaseDistance: 84,
      snapshot: {
        strategy: CrossChainIndexingStrategyIds.Omnichain,
        slowestChainIndexingCursor: 1689337584,
        snapshotTime: 1689337648,
        omnichainSnapshot: {
          omnichainStatus: OmnichainIndexingStatusIds.Completed,
          omnichainIndexingCursor: 1689337584,
          chains: {
            "11155111": {
              chainStatus: ChainIndexingStatusIds.Completed,
              config: {
                configType: ChainIndexingConfigTypeIds.Definite,
                startBlock: {
                  timestamp: 1686901632,
                  number: 3702721,
                },
                endBlock: {
                  timestamp: 1689337644,
                  number: 3890244,
                },
              },
              latestIndexedBlock: {
                timestamp: 1689337584,
                number: 3890240,
              },
            } satisfies SerializedChainIndexingStatusSnapshotCompleted,
          },
        } satisfies SerializedOmnichainIndexingStatusSnapshotCompleted,
      },
    },
  }),
};
