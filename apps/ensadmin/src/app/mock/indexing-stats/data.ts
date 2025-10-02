import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  ChainIndexingStatusSnapshotBackfill,
  ChainIndexingStatusSnapshotCompleted,
  ChainIndexingStatusSnapshotFollowing,
  ChainIndexingStatusSnapshotQueued,
  CrossChainIndexingStrategyIds,
  IndexingStatusResponseCodes,
  IndexingStatusResponseOk,
  OmnichainIndexingStatusIds,
  OmnichainIndexingStatusSnapshotBackfill,
  OmnichainIndexingStatusSnapshotCompleted,
  OmnichainIndexingStatusSnapshotFollowing,
  OmnichainIndexingStatusSnapshotUnstarted,
} from "@ensnode/ensnode-sdk";

export const unstarted = {
  responseCode: IndexingStatusResponseCodes.Ok,
  realtimeProjection: {
    projectedAt: 1759409670,
    worstCaseDistance: 2,
    snapshot: {
      strategy: CrossChainIndexingStrategyIds.Omnichain,
      slowestChainIndexingCursor: 1759409665,
      snapshotTime: 1759409668,
      omnichainSnapshot: {
        omnichainStatus: OmnichainIndexingStatusIds.Unstarted,
        omnichainIndexingCursor: 1759409665,
        chains: new Map([
          [
            1,
            {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1759409665,
                  number: 3327417,
                },
              },
            } satisfies ChainIndexingStatusSnapshotQueued,
          ],
          [
            10,
            {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1696386695,
                  number: 110393959,
                },
                endBlock: null,
              },
            } satisfies ChainIndexingStatusSnapshotQueued,
          ],
          [
            8453,
            {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1721834595,
                  number: 17522624,
                },
                endBlock: null,
              },
            } satisfies ChainIndexingStatusSnapshotQueued,
          ],
          [
            59144,
            {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1720768992,
                  number: 6682888,
                },
                endBlock: null,
              },
            } satisfies ChainIndexingStatusSnapshotQueued,
          ],
        ]),
      } satisfies OmnichainIndexingStatusSnapshotUnstarted,
    },
  },
} satisfies IndexingStatusResponseOk;

export const backfill = {
  responseCode: IndexingStatusResponseCodes.Ok,
  realtimeProjection: {
    projectedAt: 1759409670,
    worstCaseDistance: 2,
    snapshot: {
      strategy: CrossChainIndexingStrategyIds.Omnichain,
      slowestChainIndexingCursor: 1759409665,
      snapshotTime: 1759409668,
      omnichainSnapshot: {
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        omnichainIndexingCursor: 1759409665,
        chains: new Map([
          [
            1,
            {
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
            } satisfies ChainIndexingStatusSnapshotBackfill,
          ],
          [
            10,
            {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1696386695,
                  number: 110393959,
                },
                endBlock: null,
              },
            } satisfies ChainIndexingStatusSnapshotQueued,
          ],
          [
            8453,
            {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1721834595,
                  number: 17522624,
                },
                endBlock: null,
              },
            } satisfies ChainIndexingStatusSnapshotQueued,
          ],
          [
            59144,
            {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1720768992,
                  number: 6682888,
                },
                endBlock: null,
              },
            } satisfies ChainIndexingStatusSnapshotQueued,
          ],
          [
            567,
            {
              chainStatus: ChainIndexingStatusIds.Queued,
              config: {
                configType: ChainIndexingConfigTypeIds.Indefinite,
                startBlock: {
                  timestamp: 1720768999,
                  number: 6682889,
                },
                endBlock: null,
              },
            } satisfies ChainIndexingStatusSnapshotQueued,
          ],
        ]),
      } satisfies OmnichainIndexingStatusSnapshotBackfill,
    },
  },
} satisfies IndexingStatusResponseOk;

export const following = {
  responseCode: IndexingStatusResponseCodes.Ok,
  realtimeProjection: {
    projectedAt: 1755667460,
    worstCaseDistance: 10,
    snapshot: {
      strategy: CrossChainIndexingStrategyIds.Omnichain,
      slowestChainIndexingCursor: 1755667449,
      snapshotTime: 1755667450,
      omnichainSnapshot: {
        omnichainStatus: OmnichainIndexingStatusIds.Following,
        omnichainIndexingCursor: 1755667449,
        chains: new Map([
          [
            1,
            {
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
            } satisfies ChainIndexingStatusSnapshotFollowing,
          ],
          [
            10,
            {
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
            } satisfies ChainIndexingStatusSnapshotFollowing,
          ],
          [
            8453,
            {
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
            } satisfies ChainIndexingStatusSnapshotFollowing,
          ],
          [
            59144,
            {
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
            } satisfies ChainIndexingStatusSnapshotFollowing,
          ],
        ]),
      } satisfies OmnichainIndexingStatusSnapshotFollowing,
    },
  },
} satisfies IndexingStatusResponseOk;

export const completed = {
  responseCode: IndexingStatusResponseCodes.Ok,
  realtimeProjection: {
    projectedAt: 1689337587,
    worstCaseDistance: 2,
    snapshot: {
      strategy: CrossChainIndexingStrategyIds.Omnichain,
      slowestChainIndexingCursor: 1689337584,
      snapshotTime: 1689337585,
      omnichainSnapshot: {
        omnichainStatus: OmnichainIndexingStatusIds.Completed,
        omnichainIndexingCursor: 1689337584,
        chains: new Map([
          [
            11155111,
            {
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
            } satisfies ChainIndexingStatusSnapshotCompleted,
          ],
        ]),
      } satisfies OmnichainIndexingStatusSnapshotCompleted,
    },
  },
} satisfies IndexingStatusResponseOk;

//   "completed": {
//     "omnichainStatus": "completed",
//     "chains": {
//       "11155111": {
//         "status": "completed",
//         "config": {
//           "type": "definite",
//           "startBlock": {
//             "timestamp": 1686901632,
//             "number": 3702721
//           },
//           "endBlock": {
//             "timestamp": 1689337644,
//             "number": 3890244
//           }
//         },
//         "latestIndexedBlock": {
//           "timestamp": 1689337584,
//           "number": 3890240
//         }
//       }
//     },
//     "omnichainIndexingCursor": 1689337584,
//     "snapshotTime": 1689337585
//   }
// }
