import config from "@/config";
import { ChainId } from "@ensnode/ensnode-sdk";
import { http, createPublicClient } from "viem";

export function getPublicClient(chainId: ChainId) {
  // Invariant: ENSIndexer must have an rpcConfig for the `chainId` we're calling resolve() on.
  const rpcConfig = config.rpcConfigs.get(chainId);
  if (!rpcConfig) {
    throw new Error(`Invariant: ENSIndexer does not have an RPC to chain id '${chainId}'.`);
  }

  const rpcHttpEndpointURLs = Array.from(rpcConfig.httpUrls).map((rpcUrl) => rpcUrl.toString());

  // create an un-cached publicClient
  return createPublicClient({ transport: http(rpcHttpEndpointURLs[0]) });
}
