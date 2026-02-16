import {
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
} from "../indexing-status/chain-indexing-status-snapshot";
import { CrossChainIndexingStrategyIds } from "../indexing-status/cross-chain-indexing-status-snapshot";
import { OmnichainIndexingStatusIds } from "../indexing-status/omnichain-indexing-status-snapshot";
import type { SerializedConfigResponse } from "./api/config";
import { IndexingStatusResponseCodes } from "./api/indexing-status/response";
import type { SerializedIndexingStatusResponse } from "./api/indexing-status/serialized-response";
import { PluginName } from "./config/types";

export const configResponseMock = {
  labelSet: {
    labelSetId: "subgraph",
    labelSetVersion: 0,
  },
  indexedChainIds: [1, 8453, 59144, 10, 42161, 534352],
  databaseSchemaName: "alphaSchema0.31.0",
  isSubgraphCompatible: false,
  namespace: "mainnet",
  plugins: [
    PluginName.Subgraph,
    PluginName.Basenames,
    PluginName.Lineanames,
    PluginName.ThreeDNS,
    PluginName.ProtocolAcceleration,
    PluginName.Registrars,
  ],
  versionInfo: {
    nodejs: "22.18.0",
    ponder: "0.11.43",
    ensDb: "0.32.0",
    ensIndexer: "0.32.0",
    ensNormalize: "1.11.1",
    ensRainbow: "0.31.0",
    ensRainbowSchema: 2,
  },
} satisfies SerializedConfigResponse;

export const indexingStatusResponseMock = {
  realtimeProjection: {
    projectedAt: 1755182604,
    worstCaseDistance: 1013,
    snapshot: {
      strategy: CrossChainIndexingStrategyIds.Omnichain,
      slowestChainIndexingCursor: 1755181591,
      snapshotTime: 1755182591,
      omnichainSnapshot: {
        omnichainStatus: OmnichainIndexingStatusIds.Backfill,
        chains: {
          "1": {
            chainStatus: ChainIndexingStatusIds.Backfill,
            config: {
              configType: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: {
                timestamp: 1489165544,
                number: 3327417,
              },
            },
            latestIndexedBlock: {
              timestamp: 1755181591,
              number: 3791243,
            },
            backfillEndBlock: {
              timestamp: 1755182591,
              number: 23139951,
            },
          },
          "8453": {
            chainStatus: ChainIndexingStatusIds.Queued,
            config: {
              configType: ChainIndexingConfigTypeIds.Indefinite,
              startBlock: {
                timestamp: 1755181691,
                number: 17571480,
              },
            },
          },
        },
        omnichainIndexingCursor: 1755181591,
      },
    },
  },

  responseCode: IndexingStatusResponseCodes.Ok,
} satisfies SerializedIndexingStatusResponse;
