import {
  deserializeENSIndexerPublicConfig,
  SerializedEnsApiConfigResponse,
  SerializedEnsIndexerConfigResponse,
} from "@ensnode/ensnode-sdk";

const serializedEnsIndexerPublicConfig = {
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
    "registrars",
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
} satisfies SerializedEnsIndexerConfigResponse;

export const ensIndexerPublicConfig = deserializeENSIndexerPublicConfig(
  serializedEnsIndexerPublicConfig,
);

export const serializedEnsApiPublicConfig = {
  ensIndexerPublicConfig: serializedEnsIndexerPublicConfig,
  theGraphFallback: {
    canFallback: true,
    url: "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
  },
  version: "0.35.0",
} satisfies SerializedEnsApiConfigResponse;
