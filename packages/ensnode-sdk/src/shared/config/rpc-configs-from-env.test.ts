import { describe, expect, it } from "vitest";

import { ENSNamespaceIds } from "@ensnode/datasources";

import { deserializeChainId } from "../deserialize";
import { isHttpProtocol } from "../url";
import { alchemySupportsChain, dRPCSupportsChain, quickNodeSupportsChain } from "./build-rpc-urls";
import { buildRpcConfigsFromEnv } from "./rpc-configs-from-env";

const allPublicEnsNamespaceIds = Object.values(ENSNamespaceIds).filter(
  (id) => id !== ENSNamespaceIds.EnsTestEnv,
);

const rpcConfigHttp = (rpcConfig: string) =>
  rpcConfig
    .split(",")
    .map((rpcUrl) => new URL(rpcUrl))
    .filter(isHttpProtocol);

describe("buildRpcConfigsFromEnv", () => {
  const ALCHEMY_API_KEY = "my-alchemy-api-key";
  const QUICKNODE_API_KEY = "my-quicknode-api-key";
  const QUICKNODE_ENDPOINT_NAME = "my-quicknode-endpoint-name";
  const DRPC_API_KEY = "my-drpc-api-key";

  describe("Auto-generated RPC URLs, Alchemy only", () => {
    const env = {
      ALCHEMY_API_KEY,
    };

    describe.each(allPublicEnsNamespaceIds)("%s ENS namespace", (ensNamespaceId) => {
      const rpcConfigs = buildRpcConfigsFromEnv(env, ensNamespaceId);

      it.each(Object.entries(rpcConfigs))(
        "can build RPC URL for chainId %d",
        (chainIdString, rpcConfig) => {
          const chainId = deserializeChainId(chainIdString);
          const [first, ...rest] = rpcConfigHttp(rpcConfig);

          if (alchemySupportsChain(chainId)) {
            expect(first.pathname).toContain(ALCHEMY_API_KEY);
            expect(rest).toHaveLength(0);
          } else {
            // No configured provider supports this chain — falls back to chain default URL.
            expect(rest).toHaveLength(0);
          }
        },
      );
    });
  });

  describe("Auto-generated RPC URLs, Alchemy followed by QuickNode", () => {
    const env = {
      ALCHEMY_API_KEY,
      QUICKNODE_API_KEY,
      QUICKNODE_ENDPOINT_NAME,
    };

    describe.each(allPublicEnsNamespaceIds)("%s ENS namespace", (ensNamespaceId) => {
      const rpcConfigs = buildRpcConfigsFromEnv(env, ensNamespaceId);

      it.each(Object.entries(rpcConfigs))(
        "can build RPC URL for chainId %d",
        (chainIdString, rpcConfig) => {
          const chainId = deserializeChainId(chainIdString);
          const urls = rpcConfigHttp(rpcConfig);
          let i = 0;

          if (alchemySupportsChain(chainId)) {
            expect(urls[i++].pathname).toContain(ALCHEMY_API_KEY);
          }

          if (quickNodeSupportsChain(chainId)) {
            expect(urls[i].pathname).toContain(QUICKNODE_API_KEY);
            expect(urls[i++].hostname.startsWith(QUICKNODE_ENDPOINT_NAME)).toBe(true);
          }

          // any remaining url is the chain-default fallback (only when no provider matched)
          expect(urls).toHaveLength(Math.max(i, 1));
        },
      );
    });
  });

  describe("Auto-generated RPC URLs, QuickNode followed by dRPC", () => {
    const env = {
      QUICKNODE_API_KEY,
      QUICKNODE_ENDPOINT_NAME,
      DRPC_API_KEY,
    };

    describe.each(allPublicEnsNamespaceIds)("%s ENS namespace", (ensNamespaceId) => {
      const rpcConfigs = buildRpcConfigsFromEnv(env, ensNamespaceId);

      it.each(Object.entries(rpcConfigs))(
        "can build RPC URL for chainId %d",
        (chainIdString, rpcConfig) => {
          const chainId = deserializeChainId(chainIdString);
          const urls = rpcConfigHttp(rpcConfig);
          let i = 0;

          if (quickNodeSupportsChain(chainId)) {
            expect(urls[i].pathname).toContain(QUICKNODE_API_KEY);
            expect(urls[i++].hostname.startsWith(QUICKNODE_ENDPOINT_NAME)).toBe(true);
          }

          if (dRPCSupportsChain(chainId)) {
            expect(urls[i++].pathname).toContain(DRPC_API_KEY);
          }

          expect(urls).toHaveLength(Math.max(i, 1));
        },
      );
    });
  });

  describe("Auto-generated RPC URLs, QuickNode only, both API key and endpoint name provided", () => {
    const env = {
      QUICKNODE_API_KEY,
      QUICKNODE_ENDPOINT_NAME,
    };

    describe.each(allPublicEnsNamespaceIds)("%s ENS namespace", (ensNamespaceId) => {
      const rpcConfigs = buildRpcConfigsFromEnv(env, ensNamespaceId);

      it.each(Object.entries(rpcConfigs))(
        "can build RPC URL for chainId %d",
        (chainIdString, rpcConfig) => {
          const chainId = deserializeChainId(chainIdString);
          const [first, ...rest] = rpcConfigHttp(rpcConfig);

          if (quickNodeSupportsChain(chainId)) {
            expect(first.pathname).toContain(QUICKNODE_API_KEY);
            expect(first.hostname.startsWith(QUICKNODE_ENDPOINT_NAME)).toBe(true);
          }

          expect(rest).toHaveLength(0);
        },
      );
    });
  });

  describe("Auto-generated RPC URLs, QuickNode only, only API key provided", () => {
    const env = {
      QUICKNODE_API_KEY,
    };

    describe.each(allPublicEnsNamespaceIds)("%s ENS namespace", (ensNamespaceId) => {
      it("should not build RPC URL for chainId %d", () => {
        expect(() => buildRpcConfigsFromEnv(env, ensNamespaceId)).toThrowError(
          /Use of the QUICKNODE_API_KEY environment variable requires use of the QUICKNODE_ENDPOINT_NAME environment variable as well/i,
        );
      });
    });
  });

  describe("Auto-generated RPC URLs, QuickNode only, only endpoint name provided", () => {
    const env = {
      QUICKNODE_ENDPOINT_NAME,
    };

    describe.each(allPublicEnsNamespaceIds)("%s ENS namespace", (ensNamespaceId) => {
      it("should not build RPC URL for chainId %d", () => {
        expect(() => buildRpcConfigsFromEnv(env, ensNamespaceId)).toThrowError(
          /Use of the QUICKNODE_ENDPOINT_NAME environment variable requires use of the QUICKNODE_API_KEY environment variable as well/i,
        );
      });
    });
  });
});
