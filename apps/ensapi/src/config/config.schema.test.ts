import { buildConfigFromEnvironment } from "@/config/config.schema";
import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import { EnsApiEnvironment } from "@/config/environment";
import { ENSNamespaceIds } from "@ensnode/datasources";
import { RpcConfig } from "@ensnode/ensnode-sdk/internal";
import { describe, expect, it } from "vitest";

const VALID_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/1234";

const BASE_ENV = {
  DATABASE_SCHEMA: "ensapi",
  DATABASE_URL: "postgresql://user:password@localhost:5432/mydb",
  ENSINDEXER_URL: "http://localhost:42069",
  NAMESPACE: ENSNamespaceIds.Mainnet,
  RPC_URL_1: VALID_RPC_URL,
} satisfies EnsApiEnvironment;

describe("buildConfigFromEnvironment", () => {
  it("returns a valid config object using environment variables", () => {
    const config = buildConfigFromEnvironment(BASE_ENV);

    expect(config).toStrictEqual({
      port: ENSApi_DEFAULT_PORT,
      databaseUrl: BASE_ENV.DATABASE_URL,
      databaseSchemaName: BASE_ENV.DATABASE_SCHEMA,
      ensIndexerUrl: new URL(BASE_ENV.ENSINDEXER_URL),
      namespace: ENSNamespaceIds.Mainnet,
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
