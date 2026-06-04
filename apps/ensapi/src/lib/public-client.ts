import { createPublicClient, fallback, http, type PublicClient } from "viem";

import { type ENSNamespaceId, getENSRootChain } from "@ensnode/datasources";
import type { RpcConfig } from "@ensnode/ensnode-sdk/internal";

/**
 * Builds a viem {@link PublicClient} for the ENS root chain with a fallback transport over all HTTP RPCs.
 */
export function buildPublicClient(
  rootChainRpcConfig: RpcConfig,
  namespace: ENSNamespaceId,
): PublicClient {
  return createPublicClient({
    chain: getENSRootChain(namespace),
    batch: {
      multicall: {
        batchSize: 2048,
      },
    },
    transport: fallback(rootChainRpcConfig.httpRPCs.map((url) => http(url.toString()))),
  });
}
