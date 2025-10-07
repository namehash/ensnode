import type { ENSIndexerEnvironment, RpcConfigEnvironment } from "@/config/types";
import { buildAlchemyUrl, buildDRPCUrl } from "@/lib/build-rpc-urls";
import { getENSNamespaceAsFullyDefinedAtCompileTime } from "@/lib/plugin-helpers";
import { type ChainIdString, ENSNamespaceId, serializeChainId } from "@ensnode/ensnode-sdk";

/**
 * Constructs dynamic chain configuration from environment variables, scoped to chain IDs that appear
 * in the specified `namespace`.
 *
 * This function provides the following RPC URLs in the following order:
 * 1. RPC_URL_*, if available in the env
 * 2. Alchemy, if ALCHEMY_API_KEY is available in the env
 * 3. DRPC, if DRPC_API_KEY is available in the env
 *
 * TODO: also inject wss:// urls for alchemy, drpc keys
 *
 * NOTE: This function returns raw RpcConfigEnvironment values which are not yet parsed or validated.
 */
export function buildRpcConfigsFromEnv(
  env: ENSIndexerEnvironment,
  namespace: ENSNamespaceId,
): Record<ChainIdString, RpcConfigEnvironment> {
  const chainsInNamespace = Object.entries(
    getENSNamespaceAsFullyDefinedAtCompileTime(namespace),
  ).map(([, datasource]) => datasource.chain);

  const alchemyApiKey = env["ALCHEMY_API_KEY"];
  const drpcKey = env["DRPC_API_KEY"];

  const rpcConfigs: Record<ChainIdString, RpcConfigEnvironment> = {};

  for (const chain of chainsInNamespace) {
    const urls = [
      // specific env value, if specified
      env[`RPC_URL_${chain.id}`],
      // alchemy, if specified
      alchemyApiKey && buildAlchemyUrl(chain.id, alchemyApiKey),
      // drpc, if specified
      drpcKey && buildDRPCUrl(chain.id, drpcKey),
    ]
      // filter out false/undefined values from the array
      .filter(Boolean);

    // add if any urls were constructed
    if (urls.length > 0) {
      rpcConfigs[serializeChainId(chain.id)] = urls.join(","); // transform to stringarray
    }
  }

  return rpcConfigs;
}
