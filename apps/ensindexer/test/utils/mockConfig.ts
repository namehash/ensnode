import { buildConfigFromEnvironment } from "@/config/config.schema";
import type { ENSIndexerConfig } from "@/config/types";
import { DEFAULT_PORT, DEFAULT_RPC_RATE_LIMIT } from "@/lib/lib-config";
import { deepClone } from "@/lib/lib-helpers";
import { vi } from "vitest";

// default, non-exported mock configuration template
const _defaultMockConfig = buildConfigFromEnvironment({
  databaseUrl: "postgresql://postgres:postgres@localhost:5432/postgres",
  ensDeploymentChain: "mainnet",
  ensNodePublicUrl: "http://localhost:42069",
  ensAdminUrl: "http://localhost:3000",
  ponderDatabaseSchema: "test_schema",
  plugins: "subgraph",
  ensRainbowEndpointUrl: "https://api.ensrainbow.io",
  healReverseAddresses: "true",
  port: DEFAULT_PORT.toString(),
  rpcConfigs: {
    1: {
      url: "https://eth-mainnet.g.alchemy.com/v2/1234",
      maxRequestsPerSecond: DEFAULT_RPC_RATE_LIMIT.toString(),
    },
  },
  globalBlockrange: { startBlock: undefined, endBlock: undefined },
});

// the current, mutable ENSIndexerConfig for tests
let currentMockConfig: ENSIndexerConfig;

/**
 * Resets the currentMockConfig object to a deep copy of the default values.
 * This is crucial for test isolation.
 *
 * ENSURE THAT THIS IS CALLED FOR EACH NEW TEST IN beforeEach()
 */
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
  vi.mock("@/config", () => ({
    get default() {
      return currentMockConfig;
    },
  }));
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
  updateMockConfig({ globalBlockrange: { startBlock, endBlock } });
}

/**
 * Configures a chain in the current mock config
 *
 * @param chainId The chain ID to configure
 * @param url The RPC endpoint URL for the chain
 * @param maxRequestsPerSecond The maximum requests per second (defaults to 50)
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
  url: string,
  maxRequestsPerSecond: number = DEFAULT_RPC_RATE_LIMIT,
) {
  updateMockConfig({
    rpcConfigs: {
      ...(currentMockConfig.rpcConfigs || {}),
      [chainId]: { url, maxRequestsPerSecond },
    },
  });
}
