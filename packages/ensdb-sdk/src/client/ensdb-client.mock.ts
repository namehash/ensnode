import {
  type BlockRef,
  ChainIndexingStatusIds,
  CrossChainIndexingStrategyIds,
  type EnsIndexerPublicConfig,
  OmnichainIndexingStatusIds,
  PluginName,
  RangeTypeIds,
  type SerializedCrossChainIndexingStatusSnapshot,
} from "@ensnode/ensnode-sdk";

export const earlierBlockRef = {
  timestamp: 1672531199,
  number: 1024,
} as const satisfies BlockRef;

export const laterBlockRef = {
  timestamp: 1672531200,
  number: 1025,
} as const satisfies BlockRef;

export const ensDbUrl = "postgres://user:pass@localhost:5432/ensdb";

export const ensIndexerSchemaName = "ensindexer_0";

export const publicConfig = {
  ensIndexerSchemaName,
  ensRainbowPublicConfig: {
    version: "0.32.0",
    labelSet: {
      labelSetId: "subgraph",
      highestLabelSetVersion: 0,
    },
    recordsCount: 100,
  },
  labelSet: {
    labelSetId: "subgraph",
    labelSetVersion: 0,
  },
  indexedChainIds: new Set([1]),
  isSubgraphCompatible: true,
  namespace: "mainnet",
  plugins: [PluginName.Subgraph],
  versionInfo: {
    ponder: "0.11.25",
    ensDb: "0.32.0",
    ensIndexer: "0.32.0",
    ensNormalize: "1.11.1",
  },
} satisfies EnsIndexerPublicConfig;

export const serializedSnapshot = {
  strategy: CrossChainIndexingStrategyIds.Omnichain,
  slowestChainIndexingCursor: earlierBlockRef.timestamp,
  snapshotTime: earlierBlockRef.timestamp + 20,
  omnichainSnapshot: {
    omnichainStatus: OmnichainIndexingStatusIds.Following,
    chains: {
      "1": {
        chainStatus: ChainIndexingStatusIds.Following,
        config: {
          rangeType: RangeTypeIds.LeftBounded,
          startBlock: earlierBlockRef,
        },
        latestIndexedBlock: earlierBlockRef,
        latestKnownBlock: laterBlockRef,
      },
    },
    omnichainIndexingCursor: earlierBlockRef.timestamp,
  },
} satisfies SerializedCrossChainIndexingStatusSnapshot;
