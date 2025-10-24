import packageJson from "@/../package.json" with { type: "json" };

import { buildConfigFromEnvironment } from "@/config/config.schema";
import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import { EnsApiEnvironment } from "@/config/environment";
import {
  ENSIndexerPublicConfig,
  PluginName,
  serializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";
import { RpcConfig } from "@ensnode/ensnode-sdk/internal";
import { afterEach, describe, expect, it, vi } from "vitest";

const VALID_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/1234";

const BASE_ENV = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/mydb",
  ENSINDEXER_URL: "http://localhost:42069",
  RPC_URL_1: VALID_RPC_URL,
} satisfies EnsApiEnvironment;

const ENSINDEXER_PUBLIC_CONFIG = {
  namespace: "mainnet",
  databaseSchemaName: "ensapi",
  indexedChainIds: new Set([1]),
  isSubgraphCompatible: false,
  labelSet: { labelSetId: "subgraph", labelSetVersion: 0 },
  plugins: [PluginName.Subgraph],
  versionInfo: {
    ensDb: packageJson.version,
    ensIndexer: packageJson.version,
    ensRainbow: packageJson.version,
    ensRainbowSchema: 1,
    ensNormalize: "1.1.1",
    nodejs: "1.1.1",
    ponder: "1.1.1",
  },
} satisfies ENSIndexerPublicConfig;

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("buildConfigFromEnvironment", () => {
  afterEach(() => {
    mockFetch.mockReset();
  });

  it("returns a valid config object using environment variables", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(serializeENSIndexerPublicConfig(ENSINDEXER_PUBLIC_CONFIG)),
    });

    await expect(buildConfigFromEnvironment(BASE_ENV)).resolves.toStrictEqual({
      port: ENSApi_DEFAULT_PORT,
      databaseUrl: BASE_ENV.DATABASE_URL,
      ensIndexerUrl: new URL(BASE_ENV.ENSINDEXER_URL),

      ensIndexerPublicConfig: ENSINDEXER_PUBLIC_CONFIG,
      namespace: ENSINDEXER_PUBLIC_CONFIG.namespace,
      databaseSchemaName: ENSINDEXER_PUBLIC_CONFIG.databaseSchemaName,
      rpcConfigs: new Map([
        [
          1,
          {
            httpRPCs: [new URL(BASE_ENV.RPC_URL_1)],
            websocketRPC: undefined,
          } satisfies RpcConfig,
        ],
      ]),
    });
  });
});
