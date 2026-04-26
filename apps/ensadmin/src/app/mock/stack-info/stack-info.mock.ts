import type {
  SerializedEnsApiPublicConfig,
  SerializedEnsIndexerPublicConfig,
  SerializedEnsNodeStackInfo,
  TheGraphFallback,
} from "@ensnode/ensnode-sdk";

// ============================================================================
// Shared Constants
// ============================================================================

const COMMON_ENSDB_CONFIG = {
  versionInfo: {
    postgresql: "18.1",
  },
} as const;

const COMMON_ENSINDEXER_VERSION_INFO = {
  ponder: "0.11.43",
  ensDb: "1.9.0",
  ensIndexer: "1.9.0",
  ensNormalize: "1.11.1",
} as const;

const COMMON_ENSAPI_VERSION_INFO = {
  ensApi: "1.9.0",
  ensNormalize: "1.11.1",
} as const;

const COMMON_CLIENT_LABEL_SET = {
  labelSetId: "subgraph",
  labelSetVersion: 0,
} as const;

const COMMON_ENSRAINBOW_CONFIG = {
  serverLabelSet: {
    labelSetId: "subgraph",
    highestLabelSetVersion: 0,
  },
  versionInfo: {
    ensRainbow: "1.9.0",
  },
} as const;

const THE_GRAPH_FALLBACK_DISABLED: TheGraphFallback = {
  canFallback: false,
  reason: "no-api-key",
} as const;

// ============================================================================
// Variant-Specific Configurations
// ============================================================================

const ALPHA_PLUGINS = [
  "subgraph",
  "basenames",
  "lineanames",
  "threedns",
  "protocol-acceleration",
  "registrars",
  "tokenscope",
] as const satisfies string[];

const ALPHA_SEPOLIA_PLUGINS = [
  "subgraph",
  "basenames",
  "lineanames",
  "threedns",
  "protocol-acceleration",
  "registrars",
] as const satisfies string[];

const SUBGRAPH_PLUGINS = ["subgraph"] as const satisfies string[];

const ALPHA_MAINNET_CHAINS: SerializedEnsIndexerPublicConfig["indexedChainIds"] = [
  1, 8453, 59144, 10, 42161, 534352, 567,
];
const ALPHA_SEPOLIA_CHAINS: SerializedEnsIndexerPublicConfig["indexedChainIds"] = [
  11155111, 84532, 59141, 11155420, 421614, 534351,
];
const SUBGRAPH_MAINNET_CHAINS: SerializedEnsIndexerPublicConfig["indexedChainIds"] = [1];
const SUBGRAPH_SEPOLIA_CHAINS: SerializedEnsIndexerPublicConfig["indexedChainIds"] = [11155111];

// ============================================================================
// Helper Functions for Creating Variants
// ============================================================================

function createEnsDbConfig() {
  return { ...COMMON_ENSDB_CONFIG };
}

function createEnsRainbowConfig() {
  return { ...COMMON_ENSRAINBOW_CONFIG };
}

function createEnsIndexerConfig(
  namespace: SerializedEnsIndexerPublicConfig["namespace"],
  indexedChainIds: SerializedEnsIndexerPublicConfig["indexedChainIds"],
  plugins: SerializedEnsIndexerPublicConfig["plugins"],
  ensIndexerSchemaName: string,
  isSubgraphCompatible: boolean,
): SerializedEnsIndexerPublicConfig {
  return {
    clientLabelSet: { ...COMMON_CLIENT_LABEL_SET },
    indexedChainIds,
    ensIndexerSchemaName,
    isSubgraphCompatible,
    namespace,
    plugins,
    versionInfo: { ...COMMON_ENSINDEXER_VERSION_INFO },
    ensRainbowPublicConfig: createEnsRainbowConfig(),
  };
}

function createEnsApiConfig(
  namespace: SerializedEnsIndexerPublicConfig["namespace"],
  indexedChainIds: SerializedEnsIndexerPublicConfig["indexedChainIds"],
  plugins: SerializedEnsIndexerPublicConfig["plugins"],
  ensIndexerSchemaName: string,
  isSubgraphCompatible: boolean,
  theGraphFallback: TheGraphFallback,
): SerializedEnsApiPublicConfig {
  return {
    versionInfo: { ...COMMON_ENSAPI_VERSION_INFO },
    theGraphFallback,
    ensIndexerPublicConfig: {
      ...createEnsIndexerConfig(
        namespace,
        indexedChainIds,
        plugins,
        ensIndexerSchemaName,
        isSubgraphCompatible,
      ),
    },
  };
}
function createAlphaEnsIndexerConfig(
  namespace: "mainnet" | "sepolia",
  isMainnet: boolean,
): SerializedEnsIndexerPublicConfig {
  return createEnsIndexerConfig(
    namespace,
    isMainnet ? ALPHA_MAINNET_CHAINS : ALPHA_SEPOLIA_CHAINS,
    [...(isMainnet ? ALPHA_PLUGINS : ALPHA_SEPOLIA_PLUGINS)],
    isMainnet ? "alphaSchema1.9.0" : "alphaSepoliaSchema1.9.0",
    false,
  );
}

function createAlphaEnsApiConfig(
  namespace: "mainnet" | "sepolia",
  isMainnet: boolean,
  theGraphFallback: TheGraphFallback,
): SerializedEnsApiPublicConfig {
  return createEnsApiConfig(
    namespace,
    isMainnet ? ALPHA_MAINNET_CHAINS : ALPHA_SEPOLIA_CHAINS,
    [...(isMainnet ? ALPHA_PLUGINS : ALPHA_SEPOLIA_PLUGINS)],
    isMainnet ? "alphaSchema1.9.0" : "alphaSepoliaSchema1.9.0",
    false,
    theGraphFallback,
  );
}

function createSubgraphEnsIndexerConfig(
  namespace: "mainnet" | "sepolia",
  isMainnet: boolean,
): SerializedEnsIndexerPublicConfig {
  return createEnsIndexerConfig(
    namespace,
    isMainnet ? SUBGRAPH_MAINNET_CHAINS : SUBGRAPH_SEPOLIA_CHAINS,
    [...SUBGRAPH_PLUGINS],
    isMainnet ? "mainnetSchema1.9.0" : "sepoliaSchema1.9.0",
    true,
  );
}

function createSubgraphEnsApiConfig(
  namespace: "mainnet" | "sepolia",
  isMainnet: boolean,
): SerializedEnsApiPublicConfig {
  return createEnsApiConfig(
    namespace,
    isMainnet ? SUBGRAPH_MAINNET_CHAINS : SUBGRAPH_SEPOLIA_CHAINS,
    [...SUBGRAPH_PLUGINS],
    isMainnet ? "mainnetSchema1.9.0" : "sepoliaSchema1.9.0",
    true,
    { ...THE_GRAPH_FALLBACK_DISABLED },
  );
}

// ============================================================================
// Error Variant (Deserialization Error)
// ============================================================================

function createDeserializationErrorVariant(): SerializedEnsNodeStackInfo {
  return {
    ensApi: {
      versionInfo: { ...COMMON_ENSAPI_VERSION_INFO },
      theGraphFallback: { ...THE_GRAPH_FALLBACK_DISABLED },
      ensIndexerPublicConfig: {
        clientLabelSet: {
          labelSetId: "",
          labelSetVersion: 0,
        },
        versionInfo: {
          ponder: "",
          ensDb: "",
          ensIndexer: "",
          ensNormalize: "",
        },
        indexedChainIds: [11155111],
        namespace: "sepolia",
        plugins: ["subgraph"],
        ensIndexerSchemaName: "DeserializationSchema1.9.0",
        isSubgraphCompatible: true,
        ensRainbowPublicConfig: {
          serverLabelSet: {
            labelSetId: "",
            highestLabelSetVersion: -1,
          },
          versionInfo: {
            ensRainbow: "",
          },
        },
      },
    },
    ensDb: createEnsDbConfig(),
    ensIndexer: {
      clientLabelSet: {
        labelSetId: "",
        labelSetVersion: 0,
      },
      versionInfo: {
        ponder: "",
        ensDb: "",
        ensIndexer: "",
        ensNormalize: "",
      },
      indexedChainIds: [11155111],
      namespace: "sepolia",
      plugins: ["subgraph"],
      ensIndexerSchemaName: "DeserializationSchema1.9.0",
      isSubgraphCompatible: true,
      ensRainbowPublicConfig: {
        versionInfo: {
          ensRainbow: "",
        },
        serverLabelSet: {
          labelSetId: "",
          highestLabelSetVersion: -1,
        },
      },
    },
    ensRainbow: {
      versionInfo: {
        ensRainbow: "",
      },
      serverLabelSet: {
        labelSetId: "",
        highestLabelSetVersion: -1,
      },
    },
  };
}

// ============================================================================
// Record of Mock Variants
// ============================================================================

/**
 * Record of mock SerializedEnsNodeStackInfo objects keyed by variant name.
 * These can be deserialized to simulate the full deserialization process.
 */
export const mockSerializedEnsNodeStackInfo = {
  "Alpha Mainnet": {
    ensApi: createAlphaEnsApiConfig("mainnet", true, { ...THE_GRAPH_FALLBACK_DISABLED }),
    ensDb: createEnsDbConfig(),
    ensIndexer: createAlphaEnsIndexerConfig("mainnet", true),
    ensRainbow: createEnsRainbowConfig(),
  },
  "Alpha Sepolia": {
    ensApi: createAlphaEnsApiConfig("sepolia", false, { canFallback: true, url: "" }),
    ensDb: createEnsDbConfig(),
    ensIndexer: createAlphaEnsIndexerConfig("sepolia", false),
    ensRainbow: createEnsRainbowConfig(),
  },
  "Subgraph Mainnet": {
    ensApi: createSubgraphEnsApiConfig("mainnet", true),
    ensDb: createEnsDbConfig(),
    ensIndexer: createSubgraphEnsIndexerConfig("mainnet", true),
    ensRainbow: createEnsRainbowConfig(),
  },
  "Subgraph Sepolia": {
    ensApi: createSubgraphEnsApiConfig("sepolia", false),
    ensDb: createEnsDbConfig(),
    ensIndexer: createSubgraphEnsIndexerConfig("sepolia", false),
    ensRainbow: createEnsRainbowConfig(),
  },
  "Deserialization Error": createDeserializationErrorVariant(),
} as const satisfies Record<string, SerializedEnsNodeStackInfo>;
