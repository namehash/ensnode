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
  buildQuickNodeURL,
  dRPCSupportsChain,
  quickNodeSupportsChain,
} from "./build-rpc-urls";
import type { ChainIdSpecificRpcEnvironmentVariable, RpcEnvironment } from "./environments";

/**
 * Constructs dynamic chain configuration from environment variables, scoped to chain IDs that appear
 * in the specified `namespace`.
 *
 * This function auto-generates RPC URLs in the following order:
 * 1. RPC_URL_*, if available in the env
 * 2. Alchemy, if ALCHEMY_API_KEY is available in the env
 * 3. QuickNode, if both, QUICKNODE_API_KEY and QUICKNODE_ENDPOINT_NAME are specified,
 *    a QuickNode RPC URL will be provided for each of the chains it supports.
 * 4. DRPC, if DRPC_API_KEY is available in the env
 *
 * It also provides a single Alchemy wss:// url if ALCHEMY_API_KEY is available in the env.
 *
 * NOTE: This function returns raw RpcConfigEnvironment values which are not yet parsed or validated.
 *
 * @throws when only one but not both of the following environment variables are defined:
 *         {@link RpcEnvironment.QUICKNODE_API_KEY} or
 *         {@link RpcEnvironment.QUICKNODE_ENDPOINT_NAME}.
 */
export function buildRpcConfigsFromEnv(
  env: RpcEnvironment,
  namespace: ENSNamespaceId,
): Record<ChainIdString, ChainIdSpecificRpcEnvironmentVariable> {
  const alchemyApiKey = env.ALCHEMY_API_KEY;
  const quickNodeApiKey = env.QUICKNODE_API_KEY;
  const quickNodeEndpointName = env.QUICKNODE_ENDPOINT_NAME;
  const dRPCKey = env.DRPC_API_KEY;

  // Invariant: QuickNode: using API key requires using endpoint name as well.
  if (quickNodeApiKey && !quickNodeEndpointName) {
    throw new Error(
      "Use of the QUICKNODE_API_KEY environment variable requires use of the QUICKNODE_ENDPOINT_NAME environment variable as well.",
    );
  }

  // Invariant: QuickNode: using endpoint name requires using API key as well.
  if (quickNodeEndpointName && !quickNodeApiKey) {
    throw new Error(
      "Use of the QUICKNODE_ENDPOINT_NAME environment variable requires use of the QUICKNODE_API_KEY environment variable as well.",
    );
  }

  const chainsInNamespace = Object.entries(getENSNamespace(namespace)).map(
    ([, datasource]) => (datasource as Datasource).chain,
  );

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
        alchemySupportsChain(chain.id) &&
        `https://${buildAlchemyBaseUrl(chain.id, alchemyApiKey)}`,

      // QuickNode, if specified and available
      quickNodeApiKey &&
        quickNodeEndpointName &&
        quickNodeSupportsChain(chain.id) &&
        `https://${buildQuickNodeURL(chain.id, quickNodeApiKey, quickNodeEndpointName)}`,

      // dRPC, if specified and available
      dRPCKey && dRPCSupportsChain(chain.id) && buildDRPCUrl(chain.id, dRPCKey),
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
