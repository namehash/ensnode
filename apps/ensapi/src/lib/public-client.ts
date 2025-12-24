import config from "@/config";

import { ccipRequest, createPublicClient, fallback, http, type PublicClient } from "viem";

import { ensTestEnvL1Chain } from "@ensnode/datasources";
import type { ChainId } from "@ensnode/ensnode-sdk";

const _cache = new Map<ChainId, PublicClient>();

/**
 * Gets a viem#PublicClient for the specified `chainId` using the ENSApiConfig's RPCConfig. Caches
 * the instance itself to minimize unnecessary allocations.
 */
export function getPublicClient(chainId: ChainId): PublicClient {
  // Invariant: ENSApi must have an rpcConfig for the requested `chainId`
  const rpcConfig = config.rpcConfigs.get(chainId);
  if (!rpcConfig) {
    throw new Error(`Invariant: ENSApi does not have an RPC to chain id '${chainId}'.`);
  }

  if (!_cache.has(chainId)) {
    _cache.set(
      chainId,
      // Create an viem#PublicClient that uses a fallback() transport with all specified HTTP RPCs
      createPublicClient({
        transport: fallback(rpcConfig.httpRPCs.map((url) => http(url.toString()))),
        ccipRead: {
          async request({ data, sender, urls }) {
            // Inject the ens-test-env docker-compose URG url as a fallback if http://localhost:8547 fails
            if (chainId === ensTestEnvL1Chain.id) {
              return ccipRequest({ data, sender, urls: [...urls, "http://devnet:8547"] });
            }

            // otherwise, handle as normal
            return ccipRequest({ data, sender, urls });
          },
        },
      }),
    );
  }

  const publicClient = _cache.get(chainId);

  // publicClient guaranteed to exist due to cache-setting logic above
  if (!publicClient) throw new Error("never");

  return publicClient;
}
