import type { SerializedENSIndexerPublicConfig } from "./serialized-types";
import { type ENSIndexerPublicConfig, PluginName } from "./types";

export const mockedConfig = {
  databaseSchemaName: "public",
  labelSet: {
    labelSetId: "subgraph",
    labelSetVersion: 0,
  },
  indexedChainIds: new Set([1]),
  isSubgraphCompatible: true,
  namespace: "mainnet",
  plugins: [PluginName.Subgraph],
  versionInfo: {
    nodejs: "v22.10.12",
    ponder: "0.11.25",
    ensDb: "0.32.0",
    ensIndexer: "0.32.0",
    ensNormalize: "1.11.1",
    ensRainbow: "0.32.0",
    ensRainbowSchema: 2,
  },
} satisfies ENSIndexerPublicConfig;

export const mockedSerializedConfig = {
  databaseSchemaName: "public",
  labelSet: {
    labelSetId: "subgraph",
    labelSetVersion: 0,
  },
  indexedChainIds: [1],
  isSubgraphCompatible: true,
  namespace: "mainnet",
  plugins: [PluginName.Subgraph],
  versionInfo: {
    nodejs: "v22.10.12",
    ponder: "0.11.25",
    ensDb: "0.32.0",
    ensIndexer: "0.32.0",
    ensNormalize: "1.11.1",
    ensRainbow: "0.32.0",
    ensRainbowSchema: 2,
  },
} satisfies SerializedENSIndexerPublicConfig;
