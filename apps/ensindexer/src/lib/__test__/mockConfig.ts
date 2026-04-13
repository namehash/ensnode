import { vi } from "vitest";

import { buildBlockNumberRange } from "@ensnode/ensnode-sdk";

import { buildConfigFromEnvironment } from "@/config/config.schema";
import type { ENSIndexerConfig } from "@/config/types";
import { deepClone } from "@/lib/lib-helpers";

// default, non-exported mock configuration template
const _defaultMockConfig = buildConfigFromEnvironment({
  ENSDB_URL: "postgresql://postgres:postgres@localhost:5432/postgres",
  ENSINDEXER_SCHEMA_NAME: "ensindexer_0",
  NAMESPACE: "mainnet",
  PLUGINS: "subgraph",
  ENSRAINBOW_URL: "http://localhost:3223",
  LABEL_SET_ID: "ens-test-env",
  LABEL_SET_VERSION: "0",
  RPC_URL_1: "https://eth-mainnet.g.alchemy.com/v2/1234",
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
 * Sets up mocking for the ensdb-config module.
 * Call this function at the very top of the test file before any imports
 * that depend on the config (including config.schema).
 *
 * This mock uses the actual validation logic to provide proper error messages
 * but throws instead of calling process.exit(1).
 *
 * When env vars are undefined (not set), provides default test values.
 * When env vars are explicitly set (even to empty/invalid values), uses those values.
 * Tests can override values using vi.stubEnv() before accessing config.
 *
 * @example
 * // At the top of the test file (before all other imports)
 * import { setupEnsDbConfigMock } from '@/lib/__test__/mockConfig';
 * setupEnsDbConfigMock();
 *
 * // Now we can safely import modules that depend on ensdb-config
 * import { buildConfigFromEnvironment } from '@/config/config.schema';
 */
export function setupEnsDbConfigMock() {
  vi.mock("@/config/ensdb-config", async () => {
    const { validateEnsDbConfig } =
      await vi.importActual<typeof import("@ensnode/ensdb-sdk")>("@ensnode/ensdb-sdk");

    // Default test values when env vars are not explicitly set
    const defaultEnsDbUrl = "postgresql://postgres:postgres@localhost:5432/postgres";
    const defaultEnsIndexerSchemaName = "ensindexer_0";

    return {
      default: {
        get ensDbUrl() {
          // Only use default if env var is undefined (not set)
          // If explicitly set (even to empty string), use that value for validation
          const url = process.env.ENSDB_URL === undefined ? defaultEnsDbUrl : process.env.ENSDB_URL;
          const schema =
            process.env.ENSINDEXER_SCHEMA_NAME === undefined
              ? defaultEnsIndexerSchemaName
              : process.env.ENSINDEXER_SCHEMA_NAME;
          validateEnsDbConfig({ ensDbUrl: url, ensIndexerSchemaName: schema });
          return url;
        },
        get ensIndexerSchemaName() {
          const url = process.env.ENSDB_URL === undefined ? defaultEnsDbUrl : process.env.ENSDB_URL;
          const schema =
            process.env.ENSINDEXER_SCHEMA_NAME === undefined
              ? defaultEnsIndexerSchemaName
              : process.env.ENSINDEXER_SCHEMA_NAME;
          validateEnsDbConfig({ ensDbUrl: url, ensIndexerSchemaName: schema });
          return schema;
        },
      },
    };
  });
}

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
  updateMockConfig({ globalBlockrange: buildBlockNumberRange(startBlock, endBlock) });
}
