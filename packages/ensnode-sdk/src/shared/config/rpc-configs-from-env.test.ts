import { lineaSepolia } from "viem/chains";
import { describe, expect, it } from "vitest";

import { ENSNamespaceIds } from "@ensnode/datasources";

import { deserializeChainId } from "../deserialize";
import { isHttpProtocol } from "../url";
import { buildRpcConfigsFromEnv } from "./rpc-configs-from-env";

const allEnsNamespaceIds = Object.values(ENSNamespaceIds).filter(
  (id) => id !== ENSNamespaceIds.EnsTestEnv,
);

const rpcConfigHttp = (rpcConfig: string) =>
  rpcConfig
    .split(",")
    .map((rpcUrl) => new URL(rpcUrl))
    .filter(isHttpProtocol);

describe("buildRpcConfigsFromEnv", () => {
  const ALCHEMY_API_KEY = "my-alchemy-api-key";
  const DRPC_API_KEY = "my-drpc-api-key";
  const QUICKNODE_API_KEY = "my-quicknode-api-key";
  const QUICKNODE_ENDPOINT_NAME = "my-quicknode-endpoint-name";

  describe("Auto-generated RPC URLs, Alchemy only", () => {
    const env = {
      ALCHEMY_API_KEY,
    };

    describe.each(allEnsNamespaceIds)("%s ENS namespace", (ensNamespaceId) => {
      const rpcConfigs = buildRpcConfigsFromEnv(env, ensNamespaceId);

      it.each(Object.entries(rpcConfigs))(
        "can build RPC URL for chainId %d",
        (_chainId, rpcConfig) => {
          const [alchemyRpcUrl, drpcRpcUrl, quickNodeRpcUrl] = rpcConfigHttp(rpcConfig);

          expect(alchemyRpcUrl.pathname).toContain(ALCHEMY_API_KEY);
          expect(drpcRpcUrl).toBeUndefined();
          expect(quickNodeRpcUrl).toBeUndefined();
        },
      );
    });
  });

  describe("Auto-generated RPC URLs, Alchemy followed by DRPC", () => {
    const env = {
      ALCHEMY_API_KEY,
      DRPC_API_KEY,
    };

    describe.each(allEnsNamespaceIds)("%s ENS namespace", (ensNamespaceId) => {
      const rpcConfigs = buildRpcConfigsFromEnv(env, ensNamespaceId);

      it.each(Object.entries(rpcConfigs))(
        "can build RPC URL for chainId %d",
        (_chainId, rpcConfig) => {
          const [alchemyRpcUrl, drpcRpcUrl, quickNodeRpcUrl] = rpcConfigHttp(rpcConfig);

          expect(alchemyRpcUrl.pathname).toContain(ALCHEMY_API_KEY);
          expect(drpcRpcUrl.pathname).toContain(DRPC_API_KEY);
          expect(quickNodeRpcUrl).toBeUndefined();
        },
      );
    });
  });

  describe("Auto-generated RPC URLs, Alchemy followed by DRPC, followed by QuickNode", () => {
    const env = {
      ALCHEMY_API_KEY,
      DRPC_API_KEY,
      QUICKNODE_API_KEY,
      QUICKNODE_ENDPOINT_NAME,
    };

    describe.each(allEnsNamespaceIds)("%s ENS namespace", (ensNamespaceId) => {
      const rpcConfigs = buildRpcConfigsFromEnv(env, ensNamespaceId);

      it.each(Object.entries(rpcConfigs))(
        "can build RPC URL for chainId %d",
        (chainIdString, rpcConfig) => {
          const chainId = deserializeChainId(chainIdString);
          const [alchemyRpcUrl, drpcRpcUrl, quickNodeRpcUrl] = rpcConfigHttp(rpcConfig);

          expect(alchemyRpcUrl.pathname).toContain(ALCHEMY_API_KEY);
          expect(drpcRpcUrl.pathname).toContain(DRPC_API_KEY);

          // QuickNode platform does not support Linea Sepolia RPC (as of 2025-12-03).
          // https://www.quicknode.com/docs/linea
          if (chainId !== lineaSepolia.id) {
            expect(quickNodeRpcUrl.pathname).toContain(QUICKNODE_API_KEY);
            expect(quickNodeRpcUrl.hostname.startsWith(QUICKNODE_ENDPOINT_NAME)).toBe(true);
          }
        },
      );
    });
  });

  describe("Auto-generated RPC URLs, QuickNode only, both API key and endpoint name provided", () => {
    const env = {
      QUICKNODE_API_KEY,
      QUICKNODE_ENDPOINT_NAME,
    };

    describe.each(allEnsNamespaceIds)("%s ENS namespace", (ensNamespaceId) => {
      const rpcConfigs = buildRpcConfigsFromEnv(env, ensNamespaceId);

      it.each(Object.entries(rpcConfigs))(
        "can build RPC URL for chainId %d",
        (chainIdString, rpcConfig) => {
          const chainId = deserializeChainId(chainIdString);
          const [quickNodeRpcUrl] = rpcConfigHttp(rpcConfig);

          // QuickNode platform does not support Linea Sepolia RPC (as of 2025-12-03).
          // https://www.quicknode.com/docs/linea
          if (chainId !== lineaSepolia.id) {
            expect(quickNodeRpcUrl.pathname).toContain(QUICKNODE_API_KEY);
            expect(quickNodeRpcUrl.hostname.startsWith(QUICKNODE_ENDPOINT_NAME)).toBe(true);
          }
        },
      );
    });
  });

  describe("Auto-generated RPC URLs, QuickNode only, only API key provided", () => {
    const env = {
      QUICKNODE_API_KEY,
    };

    describe.each(allEnsNamespaceIds)("%s ENS namespace", (ensNamespaceId) => {
      const rpcConfigs = buildRpcConfigsFromEnv(env, ensNamespaceId);

      it("should not build RPC URL for chainId %d", () => {
        expect(Object.entries(rpcConfigs)).toHaveLength(0);
      });
    });
  });

  describe("Auto-generated RPC URLs, QuickNode only, only endpoint name provided", () => {
    const env = {
      QUICKNODE_ENDPOINT_NAME,
    };

    describe.each(allEnsNamespaceIds)("%s ENS namespace", (ensNamespaceId) => {
      const rpcConfigs = buildRpcConfigsFromEnv(env, ensNamespaceId);

      it("should not build RPC URL for chainId %d", () => {
        expect(Object.entries(rpcConfigs)).toHaveLength(0);
      });
    });
  });
});
