import { DEFAULT_PORT, DEFAULT_RPC_RATE_LIMIT } from "@/config/config.schema";
import { ChainConfig, ENSIndexerConfig } from "@/config/types";
import { PluginName } from "@ensnode/utils";
import { vi } from "vitest";

// Internal helper to deep clone configuration objects
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as any;
  }

  const clonedObj = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
}

// Default, non-exported mock configuration template
const _defaultMockConfig: ENSIndexerConfig = {
  ensDeploymentChain: "mainnet",
  ensNodePublicUrl: "http://localhost:42069",
  ensAdminUrl: "http://localhost:3000",
  ponderDatabaseSchema: "test_schema",
  plugins: [PluginName.Subgraph, PluginName.Basenames, PluginName.Lineanames],
  ensRainbowEndpointUrl: "https://api.ensrainbow.io",
  healReverseAddresses: true,
  port: DEFAULT_PORT,
  indexedChains: {},
  globalBlockrange: {
    startBlock: undefined,
    endBlock: undefined,
  },
};

// This will hold the current, mutable configuration for tests
let currentMockConfig: ENSIndexerConfig;

/**
 * Resets the currentMockConfig object to a deep copy of the default values.
 * This is crucial for test isolation.
 */
// ENSURE THAT THIS IS CALLED FOR EACH NEW TEST!!!
// ADD IT TO YOUR beforeEach() METHOD
export function resetMockConfig() {
  currentMockConfig = deepClone(_defaultMockConfig);
}

// Initialize currentMockConfig when the module is loaded.
// This ensures it's defined before setupConfigMock or any tests run.
resetMockConfig();

/**
 * Sets up mocking for app-config module
 * Call this function at the top of the test file before any imports
 * that depend on the config
 *
 * @example
 * // At the top of the test file
 * import { setupConfigMock } from './utils/mockConfig';
 * setupConfigMock();
 *
 * // Now we can safely import modules that use the config
 * import { theModule } from '@/the-module';
 */
export function setupConfigMock() {
  vi.mock("@/config/app-config", () => {
    const module = {
      getConfig: vi.fn(() => currentMockConfig),
      // Use a getter for 'config' to ensure it always returns the latest currentMockConfig
      get config() {
        return currentMockConfig;
      },
      rpcMaxRequestsPerSecond: vi.fn(
        (chainId: number) =>
          currentMockConfig.indexedChains[chainId]?.rpcMaxRequestsPerSecond ||
          DEFAULT_RPC_RATE_LIMIT
      ),
      rpcEndpointUrl: vi.fn(
        (chainId: number) =>
          currentMockConfig.indexedChains[chainId]?.rpcEndpointUrl ||
          "http://localhost:8545"
      ),
      // Use a getter for the default export as well
      get default() {
        return currentMockConfig;
      },
    };
    // Define named exports as getters pointing to currentMockConfig properties
    Object.defineProperties(module, {
      ensDeploymentChain: {
        get: () => currentMockConfig.ensDeploymentChain,
        enumerable: true,
      },
      ensNodePublicUrl: {
        get: () => currentMockConfig.ensNodePublicUrl,
        enumerable: true,
      },
      ensAdminUrl: {
        get: () => currentMockConfig.ensAdminUrl,
        enumerable: true,
      },
      ponderDatabaseSchema: {
        get: () => currentMockConfig.ponderDatabaseSchema,
        enumerable: true,
      },
      plugins: {
        get: () => currentMockConfig.plugins,
        enumerable: true,
      },
      healReverseAddresses: {
        get: () => currentMockConfig.healReverseAddresses,
        enumerable: true,
      },
      port: { get: () => currentMockConfig.port, enumerable: true },
      ensRainbowEndpointUrl: {
        get: () => currentMockConfig.ensRainbowEndpointUrl,
        enumerable: true,
      },
      globalBlockrange: {
        get: () => currentMockConfig.globalBlockrange,
        enumerable: true,
      },
      indexedChains: {
        get: () => currentMockConfig.indexedChains,
        enumerable: true,
      },
    });
    return module;
  });
}

/**
 * Updates the current mock configuration for specific tests
 *
 * @param updates Partial config object with properties to update
 * @example
 * // In the test
 * updateMockConfig({
 *   globalBlockrange: { startBlock: 100, endBlock: 200 }
 * });
 */
export function updateMockConfig(updates: Partial<ENSIndexerConfig>) {
  Object.assign(currentMockConfig, updates);
}

/**
 * Sets up the global blockrange in the current mock config
 *
 * @param startBlock Optional start block
 * @param endBlock Optional end block
 */
export function setGlobalBlockrange(startBlock?: number, endBlock?: number) {
  currentMockConfig.globalBlockrange = {
    startBlock,
    endBlock,
  };
}

/**
 * Configures a chain in the current mock config
 *
 * @param chainId The chain ID to configure
 * @param rpcEndpointUrl The RPC endpoint URL for the chain
 * @param rpcMaxRequestsPerSecond The maximum requests per second (defaults to 50)
 *
 * @example
 * // Add mainnet configuration
 * setChainConfig(1, "https://eth-mainnet.g.alchemy.com/v2/1234", 100);
 *
 * // Add base chain configuration
 * setChainConfig(8453, "https://base-mainnet.g.alchemy.com/v2/5678");
 */
export function setChainConfig(
  chainId: number,
  rpcEndpointUrl: string,
  rpcMaxRequestsPerSecond: number = 50
) {
  if (!currentMockConfig.indexedChains) {
    currentMockConfig.indexedChains = {};
  }

  currentMockConfig.indexedChains[chainId] = {
    rpcEndpointUrl,
    rpcMaxRequestsPerSecond,
  };
}

/**
 * Removes a chain configuration from the current mock config
 *
 * @param chainId The chain ID to remove
 */
export function removeChainConfig(chainId: number) {
  if (
    currentMockConfig.indexedChains &&
    currentMockConfig.indexedChains[chainId]
  ) {
    delete currentMockConfig.indexedChains[chainId];
  }
}

/**
 * Gets a copy of the current chain configurations
 *
 * @returns Record of chain configurations by chain ID
 */
export function getChainConfigs(): Record<number, ChainConfig> {
  return { ...currentMockConfig.indexedChains };
}
