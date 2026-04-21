import config from "@/config";

import type { ChainId } from "enssdk";
import { createPublicClient, fallback, http, type PublicClient } from "viem";

import { type ENSNamespaceId, getENSRootChainId } from "@ensnode/datasources";
import { buildRpcConfigsFromEnv, RpcConfigsSchema } from "@ensnode/ensnode-sdk/internal";

const _cache = new Map<ChainId, PublicClient>();

/**
 * Gets a viem#PublicClient for the specified `chainId` using the ENSApiConfig's RPCConfig. Caches
 * the instance itself to minimize unnecessary allocations.
 */
export function buildPublicClientForRootChain(namespace: ENSNamespaceId): PublicClient {
  const rootChainId = getENSRootChainId(namespace);
  const unvalidatedRpcConfigs = buildRpcConfigsFromEnv(config, namespace);
  const rpcConfigs = RpcConfigsSchema.parse(unvalidatedRpcConfigs);
  const rpcConfig = rpcConfigs.get(rootChainId);

  if (!rpcConfig) {
    throw new Error(`Invariant: ENSApi does not have an RPC to chain id '${rootChainId}'.`);
  }

  if (!_cache.has(rootChainId)) {
    _cache.set(
      rootChainId,
      // Create an viem#PublicClient that uses a fallback() transport with all specified HTTP RPCs
      createPublicClient({
        transport: fallback(rpcConfig.httpRPCs.map((url) => http(url.toString()))),
      }),
    );
  }

  const publicClient = _cache.get(rootChainId);

  // publicClient guaranteed to exist due to cache-setting logic above
  if (!publicClient) throw new Error("never");

  return publicClient;
}
