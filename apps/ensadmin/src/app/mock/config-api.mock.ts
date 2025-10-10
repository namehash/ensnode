import {
  type SerializedENSIndexerPublicConfig,
  deserializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

export const ensIndexerPublicConfig = deserializeENSIndexerPublicConfig({
  labelSet: {
    labelSetId: "subgraph",
    labelSetVersion: 0,
  },
  indexedChainIds: [1, 8453, 59144, 10, 42161, 534352, 567],
  databaseSchemaName: "alphaSchema0.34.0",
  isSubgraphCompatible: false,
  namespace: "mainnet",
  plugins: [
    "subgraph",
    "basenames",
    "lineanames",
    "threedns",
    "protocol-acceleration",
    "referrals",
    "tokenscope",
  ],
  versionInfo: {
    nodejs: "22.18.0",
    ponder: "0.11.43",
    ensIndexer: "0.35.0",
    ensDb: "0.35.0",
    ensRainbow: "0.34.0",
    ensRainbowSchema: 3,
    ensNormalize: "1.11.1",
  },
} satisfies SerializedENSIndexerPublicConfig);
