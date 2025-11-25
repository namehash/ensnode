import {
  type Datasource,
  type ENSNamespaceId,
  ensTestEnvL1Chain,
  ensTestEnvL2Chain,
  getENSNamespace,
} from "@ensnode/datasources";

import { serializeChainId } from "../serialize";
import type { ChainIdString } from "../serialized-types";
import {
  alchemySupportsChain,
  buildAlchemyBaseUrl,
  buildDRPCUrl,
  drpcSupportsChain,
} from "./build-rpc-urls";
import type { ChainIdSpecificRpcEnvironmentVariable, RpcEnvironment } from "./environments";

/**
 * Constructs dynamic chain configuration from environment variables, scoped to chain IDs that appear
 * in the specified `namespace`.
 *
 * This function provides the following RPC URLs in the following order:
 * 1. RPC_URL_*, if available in the env
 * 2. Alchemy, if ALCHEMY_API_KEY is available in the env
 * 3. DRPC, if DRPC_API_KEY is available in the env
 *
 * It also provides a single Alchemy wss:// url if ALCHEMY_API_KEY is available in the env.
 *
 * NOTE: This function returns raw RpcConfigEnvironment values which are not yet parsed or validated.
 */
export function buildRpcConfigsFromEnv(
  env: RpcEnvironment,
  namespace: ENSNamespaceId,
): Record<ChainIdString, ChainIdSpecificRpcEnvironmentVariable> {
  const chainsInNamespace = Object.entries(getENSNamespace(namespace)).map(
    ([, datasource]) => (datasource as Datasource).chain,
  );

  const alchemyApiKey = env.ALCHEMY_API_KEY;
  const drpcKey = env.DRPC_API_KEY;

  const rpcConfigs: Record<ChainIdString, ChainIdSpecificRpcEnvironmentVariable> = {};

  for (const chain of chainsInNamespace) {
    // RPC_URL_* takes precedence over convenience generation
    const specificValue = env[`RPC_URL_${chain.id}`];
    if (specificValue) {
      rpcConfigs[serializeChainId(chain.id)] = specificValue;
      continue;
    }

    // ens-test-env L1 Chain
    if (chain.id === ensTestEnvL1Chain.id) {
      rpcConfigs[serializeChainId(ensTestEnvL1Chain.id)] =
        ensTestEnvL1Chain.rpcUrls.default.http[0];
      continue;
    }

    // ens-test-env L2 Chain
    if (chain.id === ensTestEnvL2Chain.id) {
      rpcConfigs[serializeChainId(ensTestEnvL2Chain.id)] =
        ensTestEnvL2Chain.rpcUrls.default.http[0];
      continue;
    }

    const httpUrls = [
      // alchemy, if specified and available
      alchemyApiKey &&
        alchemySupportsChain(chain.id) && //
        `https://${buildAlchemyBaseUrl(chain.id, alchemyApiKey)}`,

      // drpc, if specified and available
      drpcKey &&
        drpcSupportsChain(chain.id) && //
        buildDRPCUrl(chain.id, drpcKey),
    ];

    const wsUrl =
      alchemyApiKey &&
      alchemySupportsChain(chain.id) && //
      `wss://${buildAlchemyBaseUrl(chain.id, alchemyApiKey)}`;

    const urls = [...httpUrls, wsUrl]
      // filter out false/undefined values from the set of urls
      .filter(Boolean);

    // add if any urls were constructed
    if (urls.length > 0) {
      rpcConfigs[serializeChainId(chain.id)] = urls.join(
        ",",
      ) as ChainIdSpecificRpcEnvironmentVariable;
    }
  }

  return rpcConfigs;
}
