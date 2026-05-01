import type { ChainIdString } from "enssdk";

import {
  type Datasource,
  type ENSNamespaceId,
  ensTestEnvChain,
  getENSNamespace,
} from "@ensnode/datasources";

import { serializeChainId } from "../serialize";
import type { Unvalidated } from "../types";
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
 * Mode for auto-generating RPCs across indexed chains.
 */
const RpcAutoGenModes = {
  /**
   * Auto-generates only HTTP RPCs for supported chains.
   */
  HttpOnly: "http-only",

  /**
   * Auto-generates both HTTP and WebSocket RPCs for supported chains.
   */
  HttpAndWs: "http-and-ws",
} as const;

/**
 * The derived string union of possible {@link RpcAutoGenModes}.
 */
type RpcAutoGenMode = (typeof RpcAutoGenModes)[keyof typeof RpcAutoGenModes];

/**
 * Default mode for auto-generating RPCs across indexed chains.
 */
const DEFAULT_RPC_AUTO_GEN_MODE: RpcAutoGenMode = RpcAutoGenModes.HttpOnly;

/**
 * Build the RPCs auto-generation mode based on environment variables, with validation.
 *
 * Note: if env.RPC_AUTO_GEN_MODE is not set,
 * {@link DEFAULT_RPC_AUTO_GEN_MODE} will be used as the default.
 *
 * @param env The RPC environment variables to determine the auto-generation mode.
 * @returns The RPCs auto-generation mode to use for building RPC configurations.
 * @throws Error if the provided RPC_AUTO_GEN_MODE env var is invalid.
 */
export function buildRpcAutoGenMode(env: RpcEnvironment): RpcAutoGenMode {
  const mode = env.RPC_AUTO_GEN_MODE as Unvalidated<RpcAutoGenMode>;

  if (!mode) {
    return DEFAULT_RPC_AUTO_GEN_MODE;
  }

  if (!Object.values(RpcAutoGenModes).includes(mode)) {
    throw new Error(
      `Invalid RPC_AUTO_GEN_MODE env var: ${mode}. Valid values are: ${Object.values(RpcAutoGenModes).join(", ")}`,
    );
  }

  return mode;
}

/**
 * Constructs dynamic chain configuration from environment variables, scoped to chain IDs that appear
 * in the specified `namespace`.
 *
 * This function auto-generates RPCs, depending on
 * the configured {@link RpcAutoGenMode}, in the following order:
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

  const rpcAutoGenMode = buildRpcAutoGenMode(env);
  const rpcConfigs: Record<ChainIdString, ChainIdSpecificRpcEnvironmentVariable> = {};

  for (const chain of chainsInNamespace) {
    // RPC_URL_* takes precedence over convenience generation
    const specificValue = env[`RPC_URL_${chain.id}`];
    if (specificValue) {
      rpcConfigs[serializeChainId(chain.id)] = specificValue;
      continue;
    }

    // ens-test-env Chain
    if (chain.id === ensTestEnvChain.id) {
      rpcConfigs[serializeChainId(ensTestEnvChain.id)] = ensTestEnvChain.rpcUrls.default.http[0];
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
      rpcAutoGenMode === RpcAutoGenModes.HttpAndWs &&
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
