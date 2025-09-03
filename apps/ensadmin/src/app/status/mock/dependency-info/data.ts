import {
  ChainId,
  ENSIndexerPublicConfig,
  ENSNamespaceId,
  ENSNamespaceIds,
  PluginName,
} from "@ensnode/ensnode-sdk";

export const MockENSIndexerPublicConfig: ENSIndexerPublicConfig = {
  namespace: ENSNamespaceIds.Mainnet as ENSNamespaceId,
  ensAdminUrl: new URL("https://admin.ensnode.io/"),
  ensNodePublicUrl: new URL("https://api.alpha.green.ensnode.io/"),
  labelSet: {
    labelSetId: "subgraph",
    labelSetVersion: 0,
  },
  databaseSchemaName: "alphaSchema0.34.0",
  plugins: [
    PluginName.Subgraph,
    PluginName.Basenames,
    PluginName.Lineanames,
    PluginName.ThreeDNS,
    PluginName.Referrals,
  ],
  healReverseAddresses: true,
  indexAdditionalResolverRecords: false,
  replaceUnnormalized: false,
  isSubgraphCompatible: true,
  dependencyInfo: {
    nodejs: "22.18.0",
    ponder: "0.11.43",
    ensRainbow: "0.34.0",
    ensRainbowSchema: 3,
  },
  indexedChainIds: new Set<ChainId>([1, 8453, 59144, 10, 42161, 534352]),
};
