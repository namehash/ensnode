import packageJson from "@/../package.json" with { type: "json" };

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RpcConfig } from "@ensnode/ensnode-sdk/internal";

import { buildConfigFromEnvironment } from "@/config/config.schema";
import { ENSApi_DEFAULT_PORT } from "@/config/defaults";
import type { EnsApiEnvironment } from "@/config/environment";
import logger from "@/lib/logger";

vi.mock("@/lib/logger", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const VALID_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/1234";

const BASE_ENV = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/mydb",
  DATABASE_SCHEMA: "ensapi",
  ENSINDEXER_URL: "http://localhost:42069",
  NAMESPACE: "mainnet",
  RPC_URL_1: VALID_RPC_URL,
} satisfies EnsApiEnvironment;

describe("buildConfigFromEnvironment", () => {
  it("returns a valid config object using environment variables", () => {
    const result = buildConfigFromEnvironment(BASE_ENV);

    expect(result).toStrictEqual({
      version: packageJson.version,
      port: ENSApi_DEFAULT_PORT,
      databaseUrl: BASE_ENV.DATABASE_URL,
      databaseSchemaName: BASE_ENV.DATABASE_SCHEMA,
      ensIndexerUrl: new URL(BASE_ENV.ENSINDEXER_URL),
      theGraphApiKey: undefined,
      namespace: BASE_ENV.NAMESPACE,
      rpcConfigs: new Map([
        [
          1,
          {
            httpRPCs: [new URL(BASE_ENV.RPC_URL_1)],
            websocketRPC: undefined,
          } satisfies RpcConfig,
        ],
      ]),
      customReferralProgramEditionConfigSetUrl: undefined,
    });
  });

  it("parses CUSTOM_REFERRAL_PROGRAM_EDITIONS as a URL object", () => {
    const customUrl = "https://example.com/editions.json";

    const config = buildConfigFromEnvironment({
      ...BASE_ENV,
      CUSTOM_REFERRAL_PROGRAM_EDITIONS: customUrl,
    });

    expect(config.customReferralProgramEditionConfigSetUrl).toEqual(new URL(customUrl));
  });

  describe("Useful error messages", () => {
    // Mock process.exit to prevent actual exit
    const mockExit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      mockExit.mockClear();
    });

    const TEST_ENV: EnsApiEnvironment = {
      DATABASE_URL: BASE_ENV.DATABASE_URL,
      DATABASE_SCHEMA: BASE_ENV.DATABASE_SCHEMA,
      ENSINDEXER_URL: BASE_ENV.ENSINDEXER_URL,
      NAMESPACE: "mainnet",
    };

    it("logs error and exits when CUSTOM_REFERRAL_PROGRAM_EDITIONS is not a valid URL", () => {
      buildConfigFromEnvironment({
        ...TEST_ENV,
        CUSTOM_REFERRAL_PROGRAM_EDITIONS: "not-a-url",
      });

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("CUSTOM_REFERRAL_PROGRAM_EDITIONS is not a valid URL: not-a-url"),
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it("logs error message when QuickNode RPC config was partially configured (missing endpoint name)", () => {
      buildConfigFromEnvironment({
        ...TEST_ENV,
        QUICKNODE_API_KEY: "my-api-key",
      });

      expect(logger.error).toHaveBeenCalledWith(
        new Error(
          "Use of the QUICKNODE_API_KEY environment variable requires use of the QUICKNODE_ENDPOINT_NAME environment variable as well.",
        ),
        "Failed to build EnsApiConfig",
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it("logs error message when QuickNode RPC config was partially configured (missing API key)", () => {
      buildConfigFromEnvironment({
        ...TEST_ENV,
        QUICKNODE_ENDPOINT_NAME: "my-endpoint-name",
      });

      expect(logger.error).toHaveBeenCalledWith(
        new Error(
          "Use of the QUICKNODE_ENDPOINT_NAME environment variable requires use of the QUICKNODE_API_KEY environment variable as well.",
        ),
        "Failed to build EnsApiConfig",
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});
