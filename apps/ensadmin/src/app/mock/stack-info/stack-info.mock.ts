import type {
  SerializedEnsApiPublicConfig,
  SerializedEnsIndexerPublicConfig,
  SerializedEnsNodeStackInfo,
  TheGraphFallback,
} from "@ensnode/ensnode-sdk";

// ============================================================================
// Shared Constants
// ============================================================================

const COMMON_ENS_DB = {
  versionInfo: {
    postgresql: "18.1",
  },
} as const;

const COMMON_VERSION_INFO = {
  ponder: "0.11.43",
  ensDb: "1.9.0",
  ensIndexer: "1.9.0",
  ensNormalize: "1.11.1",
} as const;

const COMMON_ENS_API_VERSION_INFO = {
  ensApi: "1.9.0",
  ensNormalize: "1.11.1",
} as const;

const COMMON_LABEL_SET = {
  labelSetId: "subgraph",
  labelSetVersion: 0,
} as const;

const COMMON_ENS_RAINBOW = {
  version: "1.9.0",
  labelSet: {
    labelSetId: "subgraph",
    highestLabelSetVersion: 0,
  },
  recordsCount: 100,
} as const;

const ENS_RAINBOW_PUBLIC_CONFIG = {
  version: "1.9.0",
  labelSet: {
    labelSetId: "subgraph",
    highestLabelSetVersion: 0,
  },
  recordsCount: 100,
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

function createEnsRainbow() {
  return { ...COMMON_ENS_RAINBOW };
}

function createEnsIndexer(
  namespace: SerializedEnsIndexerPublicConfig["namespace"],
  indexedChainIds: SerializedEnsIndexerPublicConfig["indexedChainIds"],
  plugins: SerializedEnsIndexerPublicConfig["plugins"],
  ensIndexerSchemaName: string,
  isSubgraphCompatible: boolean,
): SerializedEnsIndexerPublicConfig {
  return {
    labelSet: { ...COMMON_LABEL_SET },
    indexedChainIds,
    ensIndexerSchemaName,
    isSubgraphCompatible,
    namespace,
    plugins,
    versionInfo: { ...COMMON_VERSION_INFO },
    ensRainbowPublicConfig: { ...ENS_RAINBOW_PUBLIC_CONFIG },
  };
}

function createEnsApi(
  namespace: SerializedEnsIndexerPublicConfig["namespace"],
  indexedChainIds: SerializedEnsIndexerPublicConfig["indexedChainIds"],
  plugins: SerializedEnsIndexerPublicConfig["plugins"],
  ensIndexerSchemaName: string,
  isSubgraphCompatible: boolean,
  theGraphFallback: TheGraphFallback,
): SerializedEnsApiPublicConfig {
  return {
    versionInfo: { ...COMMON_ENS_API_VERSION_INFO },
    theGraphFallback,
    ensIndexerPublicConfig: {
      labelSet: { ...COMMON_LABEL_SET },
      versionInfo: { ...COMMON_VERSION_INFO },
      indexedChainIds,
      namespace,
      plugins,
      ensIndexerSchemaName,
      isSubgraphCompatible,
      ensRainbowPublicConfig: { ...ENS_RAINBOW_PUBLIC_CONFIG },
    },
  };
}

function createAlphaEnsIndexer(
  namespace: "mainnet" | "sepolia",
  isMainnet: boolean,
): SerializedEnsIndexerPublicConfig {
  return createEnsIndexer(
    namespace,
    isMainnet ? ALPHA_MAINNET_CHAINS : ALPHA_SEPOLIA_CHAINS,
    [...(isMainnet ? ALPHA_PLUGINS : ALPHA_SEPOLIA_PLUGINS)],
    isMainnet ? "alphaSchema1.9.0" : "alphaSepoliaSchema1.9.0",
    false,
  );
}

function createAlphaEnsApi(
  namespace: "mainnet" | "sepolia",
  isMainnet: boolean,
  theGraphFallback: TheGraphFallback,
): SerializedEnsApiPublicConfig {
  return createEnsApi(
    namespace,
    isMainnet ? ALPHA_MAINNET_CHAINS : ALPHA_SEPOLIA_CHAINS,
    [...(isMainnet ? ALPHA_PLUGINS : ALPHA_SEPOLIA_PLUGINS)],
    isMainnet ? "alphaSchema1.9.0" : "alphaSepoliaSchema1.9.0",
    false,
    theGraphFallback,
  );
}

function createSubgraphEnsIndexer(
  namespace: "mainnet" | "sepolia",
  isMainnet: boolean,
): SerializedEnsIndexerPublicConfig {
  return createEnsIndexer(
    namespace,
    isMainnet ? SUBGRAPH_MAINNET_CHAINS : SUBGRAPH_SEPOLIA_CHAINS,
    [...SUBGRAPH_PLUGINS],
    isMainnet ? "mainnetSchema1.9.0" : "sepoliaSchema1.9.0",
    true,
  );
}

function createSubgraphEnsApi(
  namespace: "mainnet" | "sepolia",
  isMainnet: boolean,
): SerializedEnsApiPublicConfig {
  return createEnsApi(
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
      versionInfo: { ...COMMON_ENS_API_VERSION_INFO },
      theGraphFallback: { ...THE_GRAPH_FALLBACK_DISABLED },
      ensIndexerPublicConfig: {
        labelSet: {
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
          version: "",
          labelSet: {
            labelSetId: "",
            highestLabelSetVersion: -1,
          },
          recordsCount: -1,
        },
      },
    },
    ensDb: { ...COMMON_ENS_DB },
    ensIndexer: {
      labelSet: {
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
        version: "",
        labelSet: {
          labelSetId: "",
          highestLabelSetVersion: -1,
        },
        recordsCount: -1,
      },
    },
    ensRainbow: {
      version: "",
      labelSet: {
        labelSetId: "",
        highestLabelSetVersion: -1,
      },
      recordsCount: -1,
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
    ensApi: createAlphaEnsApi("mainnet", true, { ...THE_GRAPH_FALLBACK_DISABLED }),
    ensDb: { ...COMMON_ENS_DB },
    ensIndexer: createAlphaEnsIndexer("mainnet", true),
    ensRainbow: createEnsRainbow(),
  },
  "Alpha Sepolia": {
    ensApi: createAlphaEnsApi("sepolia", false, { canFallback: true, url: "" }),
    ensDb: { ...COMMON_ENS_DB },
    ensIndexer: createAlphaEnsIndexer("sepolia", false),
    ensRainbow: createEnsRainbow(),
  },
  "Subgraph Mainnet": {
    ensApi: createSubgraphEnsApi("mainnet", true),
    ensDb: { ...COMMON_ENS_DB },
    ensIndexer: createSubgraphEnsIndexer("mainnet", true),
    ensRainbow: createEnsRainbow(),
  },
  "Subgraph Sepolia": {
    ensApi: createSubgraphEnsApi("sepolia", false),
    ensDb: { ...COMMON_ENS_DB },
    ensIndexer: createSubgraphEnsIndexer("sepolia", false),
    ensRainbow: createEnsRainbow(),
  },
  "Deserialization Error": createDeserializationErrorVariant(),
} as const satisfies Record<string, SerializedEnsNodeStackInfo>;
