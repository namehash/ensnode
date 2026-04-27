import packageJson from "@/../package.json" with { type: "json" };

import {
  ChainIndexingStatusIds,
  CrossChainIndexingStrategyIds,
  deserializeIndexingMetadataContext,
  type EnsRainbowPublicConfig,
  type IndexingMetadataContextInitialized,
  IndexingMetadataContextStatusCodes,
  OmnichainIndexingStatusIds,
  PluginName,
  RangeTypeIds,
  type SerializedCrossChainIndexingStatusSnapshot,
  type SerializedEnsDbPublicConfig,
  type SerializedEnsIndexerPublicConfig,
  type SerializedEnsIndexerStackInfo,
  type SerializedIndexingMetadataContextInitialized,
} from "@ensnode/ensnode-sdk";

import type { EnsApiEnvironment } from "@/config/environment";

export const VALID_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/1234";

export const ENSDB_PUBLIC_CONFIG = {
  versionInfo: {
    postgresql: "17.4",
  },
} satisfies SerializedEnsDbPublicConfig;

export const ENSINDEXER_PUBLIC_CONFIG = {
  namespace: "mainnet",
  ensIndexerSchemaName: "ensindexer_0",
  ensRainbowPublicConfig: {
    serverLabelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
    versionInfo: {
      ensRainbow: packageJson.version,
    },
  },
  indexedChainIds: [1],
  isSubgraphCompatible: false,
  clientLabelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
  plugins: [PluginName.Subgraph],
  versionInfo: {
    ensDb: packageJson.version,
    ensIndexer: packageJson.version,
    ensNormalize: "1.1.1",
    ponder: "0.8.0",
  },
} satisfies SerializedEnsIndexerPublicConfig;

const ENSRAINBOW_PUBLIC_CONFIG = {
  serverLabelSet: { labelSetId: "subgraph", highestLabelSetVersion: 0 },
  versionInfo: {
    ensRainbow: packageJson.version,
  },
} satisfies EnsRainbowPublicConfig;

export const INDEXING_STATUS = {
  strategy: CrossChainIndexingStrategyIds.Omnichain,
  slowestChainIndexingCursor: 1777147427,
  snapshotTime: 1777147440,
  omnichainSnapshot: {
    omnichainStatus: OmnichainIndexingStatusIds.Following,
    chains: {
      "1": {
        chainStatus: ChainIndexingStatusIds.Following,
        config: {
          rangeType: RangeTypeIds.LeftBounded,
          startBlock: {
            timestamp: 1489165544,
            number: 3327417,
          },
        },
        latestIndexedBlock: {
          timestamp: 1777147427,
          number: 24959286,
        },
        latestKnownBlock: {
          timestamp: 1777147427,
          number: 24959286,
        },
      },
    },
    omnichainIndexingCursor: 1777147427,
  },
} satisfies SerializedCrossChainIndexingStatusSnapshot;

export const ENSINDEXER_STACK_INFO = {
  ensDb: ENSDB_PUBLIC_CONFIG,
  ensIndexer: ENSINDEXER_PUBLIC_CONFIG,
  ensRainbow: ENSRAINBOW_PUBLIC_CONFIG,
} satisfies SerializedEnsIndexerStackInfo;

export const INDEXING_METADATA_CONTEXT = {
  statusCode: IndexingMetadataContextStatusCodes.Initialized,
  indexingStatus: INDEXING_STATUS,
  stackInfo: ENSINDEXER_STACK_INFO,
} satisfies SerializedIndexingMetadataContextInitialized;

export const indexingMetadataContextInitialized = deserializeIndexingMetadataContext(
  INDEXING_METADATA_CONTEXT,
) as IndexingMetadataContextInitialized;

export const BASE_ENV = {
  ENSDB_URL: "postgresql://user:password@localhost:5432/mydb",
  ENSINDEXER_SCHEMA_NAME: "ensindexer_0",
  RPC_URL_1: VALID_RPC_URL,
} satisfies EnsApiEnvironment;
