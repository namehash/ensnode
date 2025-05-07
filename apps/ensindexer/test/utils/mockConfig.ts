import { vi } from "vitest";
import { ChainConfig } from "@/config/types";

// Default mock configuration object that can be modified by tests
export const mockConfig: any = {
  ensDeploymentChain: "mainnet",
  ensNodePublicUrl: "http://localhost:42069",
  ensAdminUrl: "http://localhost:3000",
  ponderDatabaseSchema: "test_schema",
  requestedPluginNames: ["subgraph", "basenames", "lineanames"],
  ensRainbowEndpointUrl: "https://api.ensrainbow.io",
  chains: {},
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
  vi.mock("@/config/app-config", () => {
    return {
      getConfig: vi.fn(() => mockConfig),
      rpcMaxRequestsPerSecond: vi.fn(
        (chainId: number) =>
          mockConfig.chains[chainId]?.rpcMaxRequestsPerSecond || 50
      ),
      rpcEndpointUrl: vi.fn(
        (chainId: number) =>
          mockConfig.chains[chainId]?.rpcEndpointUrl || "http://localhost:8545"
      ),
    };
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
 * Resets the mock configuration to default values
 */
export function resetMockConfig() {
  // Reset to defaults
  mockConfig.ensDeploymentChain = "mainnet";
  mockConfig.ensNodePublicUrl = "http://localhost:42069";
  mockConfig.ensAdminUrl = "http://localhost:3000";
  mockConfig.ponderDatabaseSchema = "test_schema";
  mockConfig.requestedPluginNames = ["subgraph", "basenames", "lineanames"];
  mockConfig.ensRainbowEndpointUrl = "https://api.ensrainbow.io";
  mockConfig.chains = {};
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
  rpcMaxRequestsPerSecond: number = 50
) {
  if (!mockConfig.chains) {
    mockConfig.chains = {};
  }

  mockConfig.chains[chainId] = {
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
  if (mockConfig.chains && mockConfig.chains[chainId]) {
    delete mockConfig.chains[chainId];
  }
}

/**
 * Gets the current chain configurations
 *
 * @returns Record of chain configurations by chain ID
 */
export function getChainConfigs(): Record<number, ChainConfig> {
  return { ...mockConfig.chains };
}
