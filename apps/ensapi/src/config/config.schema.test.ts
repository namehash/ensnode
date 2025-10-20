import { buildConfigFromEnvironment } from "@/config/config.schema";
import { EnsApiEnvironment } from "@/config/environment";
import { RpcConfig } from "@ensnode/ensnode-sdk/internal";
import { describe, expect, it } from "vitest";

const VALID_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/1234";

const BASE_ENV = {
  DATABASE_SCHEMA: "ensapi",
  DATABASE_URL: "postgresql://user:password@localhost:5432/mydb",
  ENSINDEXER_URL: "http://localhost:42069",
  RPC_URL_11155111: VALID_RPC_URL,
} satisfies EnsApiEnvironment;

describe("buildConfigFromEnvironment", () => {
  it("returns a valid config object using environment variables", () => {
    const config = buildConfigFromEnvironment(BASE_ENV);

    expect(config).toStrictEqual({
      databaseUrl: BASE_ENV.DATABASE_URL,
      databaseSchemaName: BASE_ENV.DATABASE_SCHEMA,
      ensIndexerUrl: new URL(BASE_ENV.ENSINDEXER_URL),
      rpcConfigs: new Map([
        [
          11155111,
          {
            httpRPCs: [new URL(BASE_ENV.RPC_URL_11155111)],
            websocketRPC: undefined,
          } satisfies RpcConfig,
        ],
      ]),
    });
  });
});
