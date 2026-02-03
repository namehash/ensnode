import packageJson from "@/../package.json" with { type: "json" };

import {
  ENS_HOLIDAY_AWARDS_END_DATE,
  ENS_HOLIDAY_AWARDS_START_DATE,
} from "@namehash/ens-referrals";

import type { EnsApiConfigInput } from "@/config/config.schema";
import { ENSApi_DEFAULT_PORT } from "@/config/defaults";

/**
 * Mock configuration used exclusively for OpenAPI spec generation.
 *
 * When OPENAPI_GENERATE_MODE is enabled, ENSApi uses this mock config
 * to start without requiring real database or indexer connections.
 * This allows the OpenAPI spec to be generated in CI environments.
 *
 * Additionally, when `inOpenApiGenerateMode` is true (set by this config),
 * all routes return HTTP 503 Service Unavailable except for `/openapi.json`.
 */
export function buildOpenApiMockConfig(port?: string): EnsApiConfigInput {
  return {
    port: port || ENSApi_DEFAULT_PORT,
    databaseUrl:
      "postgresql://mock_openapi_only:mock_openapi_only@localhost:5432/mock_openapi_only",
    databaseSchemaName: "public",
    ensIndexerUrl: "http://localhost:42069",
    theGraphApiKey: undefined,
    namespace: "mainnet",
    rpcConfigs: {
      // Intentionally non-functional RPC URL used only in OPENAPI_GENERATE_MODE
      // for OpenAPI spec generation; ENSApi will not attempt to connect to this.
      "1": "https://rpc.example.com",
    },
    ensIndexerPublicConfig: {
      labelSet: {
        labelSetId: "ens-default",
        labelSetVersion: 1,
      },
      indexedChainIds: [1],
      isSubgraphCompatible: false,
      namespace: "mainnet",
      plugins: ["subgraph"],
      databaseSchemaName: "public",
      versionInfo: {
        nodejs: process.version,
        ponder: "0.0.0",
        ensDb: packageJson.version,
        ensIndexer: packageJson.version,
        ensNormalize: "0.0.0",
        ensRainbow: packageJson.version,
        ensRainbowSchema: 1,
      },
    },
    ensHolidayAwardsStart: new Date(ENS_HOLIDAY_AWARDS_START_DATE * 1000).toISOString(),
    ensHolidayAwardsEnd: new Date(ENS_HOLIDAY_AWARDS_END_DATE * 1000).toISOString(),
    inOpenApiGenerateMode: true,
  };
}
