import config from "@/config";

import { createPublicClient, fallback, http, type PublicClient } from "viem";

import type { ChainId } from "@ensnode/ensnode-sdk";

export function getPublicClient(chainId: ChainId): PublicClient {
  // Invariant: ENSApi must have an rpcConfig for the requested `chainId`
  const rpcConfig = config.rpcConfigs.get(chainId);
  if (!rpcConfig) {
    throw new Error(`Invariant: ENSApi does not have an RPC to chain id '${chainId}'.`);
  }

  // Create an un-cached publicClient that uses a fallback() transport with all specified HTTP RPCs
  return createPublicClient({
    transport: fallback(
      rpcConfig.httpRPCs.map((url) => http(url.toString())),
      {
        // Transport Ranking enables each of the Transports passed to
        // the "fallback transport" to be automatically ranked based on their
        // latency & stability via a weighted moving score algorithm.
        // https://v1.viem.sh/docs/clients/transports/fallback.html#transport-ranking
        rank: true,
      },
    ),
  });
}
