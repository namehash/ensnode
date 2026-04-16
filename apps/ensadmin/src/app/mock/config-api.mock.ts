import { deserializeENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";

export const ensIndexerPublicConfig = deserializeENSIndexerPublicConfig({
  labelSet: {
    labelSetId: "subgraph",
    labelSetVersion: 0,
  },
  indexedChainIds: [1, 8453, 59144, 10, 42161, 534352, 567],
  ensIndexerSchemaName: "alphaSchema0.34.0",
  ensRainbowPublicConfig: {
    version: "0.34.0",
    labelSet: {
      labelSetId: "subgraph",
      highestLabelSetVersion: 0,
    },
    recordsCount: 100,
  },
  isSubgraphCompatible: false,
  namespace: "mainnet",
  plugins: [
    "subgraph",
    "basenames",
    "lineanames",
    "threedns",
    "protocol-acceleration",
    "registrars",
    "tokenscope",
  ],
  versionInfo: {
    ponder: "0.11.43",
    ensIndexer: "0.35.0",
    ensDb: "0.35.0",
    ensNormalize: "1.11.1",
  },
});
