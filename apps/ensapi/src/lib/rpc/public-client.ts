import config from "@/config";
import { ChainId } from "@ensnode/ensnode-sdk";
import { http, PublicClient, createPublicClient, fallback } from "viem";

export function getPublicClient(chainId: ChainId): PublicClient {
  // Invariant: ENSIndexer must have an rpcConfig for the requested `chainId`
  const rpcConfig = config.rpcConfigs.get(chainId);
  if (!rpcConfig) {
    throw new Error(`Invariant: ENSIndexer does not have an RPC to chain id '${chainId}'.`);
  }

  // create an un-cached publicClient that uses a fallback() transport with all specified HTTP RPCs
  return createPublicClient({
    transport: fallback(rpcConfig.httpRPCs.map((url) => http(url.toString()))),
  });
}
