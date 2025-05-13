import { ChainConfig, ENSIndexerConfig } from "@/config/config.schema";
import { PluginName } from "@ensnode/utils";
import { vi } from "vitest";

// Default mock configuration object that can be modified by tests
export const mockConfig: ENSIndexerConfig = {
  ensDeploymentChain: "mainnet",
  ensNodePublicUrl: "http://localhost:42069",
  ensAdminUrl: "http://localhost:3000",
  ponderDatabaseSchema: "test_schema",
  requestedPluginNames: [PluginName.Subgraph, PluginName.Basenames, PluginName.Lineanames],
  ensRainbowEndpointUrl: "https://api.ensrainbow.io",
  healReverseAddresses: true,
  port: 42069,
  indexedChains: {},
  globalBlockrange: {
    startBlock: undefined,
    endBlock: undefined,
  },
};

/**
 * Sets up mocking for app-config module
 * Call this function at the top of your test file before any imports
 * that depend on the config
 *
 * @example
 * // At the top of your test file
 * import { setupConfigMock } from './utils/mockConfig';
 * setupConfigMock();
 *
 * // Now you can safely import modules that use config
 * import { yourModule } from '@/your-module';
 */
export function setupConfigMock() {
  // Use mockConfig directly - no proxy
  // This works because vi.mock is hoisted to the top of the file
  // and mockConfig is a top-level variable
  vi.mock("@/config/app-config", () => {
    const module = {
      getConfig: vi.fn(() => mockConfig),
      config: mockConfig,
      rpcMaxRequestsPerSecond: vi.fn(
        (chainId: number) => mockConfig.indexedChains[chainId]?.rpcMaxRequestsPerSecond || 50,
      ),
      rpcEndpointUrl: vi.fn(
        (chainId: number) =>
          mockConfig.indexedChains[chainId]?.rpcEndpointUrl || "http://localhost:8545",
      ),
      default: mockConfig, // Mock the default export too
    };
    return module;
  });
}

/**
 * Updates the mock configuration for specific tests
 *
 * @param updates Partial config object with properties to update
 * @example
 * // In your test
 * updateMockConfig({
 *   globalBlockrange: { startBlock: 100, endBlock: 200 }
 * });
 */
export function updateMockConfig(updates: Partial<typeof mockConfig>) {
  Object.assign(mockConfig, updates);
}

/**
 * Resets the mockConfig object to its default values.
 * This is useful for tests that need to start with a clean slate.
 */
export function resetMockConfig() {
  mockConfig.ensDeploymentChain = "mainnet";
  mockConfig.ensNodePublicUrl = "http://localhost:42069";
  mockConfig.ensAdminUrl = "http://localhost:3000";
  mockConfig.ponderDatabaseSchema = "test_schema";
  mockConfig.requestedPluginNames = [
    PluginName.Subgraph,
    PluginName.Basenames,
    PluginName.Lineanames,
  ];
  mockConfig.ensRainbowEndpointUrl = "https://api.ensrainbow.io";
  mockConfig.healReverseAddresses = true;
  mockConfig.port = 42069;
  mockConfig.indexedChains = {};
  mockConfig.globalBlockrange = {
    startBlock: undefined,
    endBlock: undefined,
  };
}

/**
 * Sets up the global blockrange in the mock config
 *
 * @param startBlock Optional start block
 * @param endBlock Optional end block
 */
export function setGlobalBlockrange(startBlock?: number, endBlock?: number) {
  mockConfig.globalBlockrange = {
    startBlock,
    endBlock,
  };
}

/**
 * Configures a chain in the mock config
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
  rpcMaxRequestsPerSecond: number = 50,
) {
  if (!mockConfig.indexedChains) {
    mockConfig.indexedChains = {};
  }

  mockConfig.indexedChains[chainId] = {
    rpcEndpointUrl,
    rpcMaxRequestsPerSecond,
  };
}

/**
 * Removes a chain configuration from the mock config
 *
 * @param chainId The chain ID to remove
 */
export function removeChainConfig(chainId: number) {
  if (mockConfig.indexedChains && mockConfig.indexedChains[chainId]) {
    delete mockConfig.indexedChains[chainId];
  }
}

/**
 * Gets the current chain configurations
 *
 * @returns Record of chain configurations by chain ID
 */
export function getChainConfigs(): Record<number, ChainConfig> {
  return { ...mockConfig.indexedChains };
}
