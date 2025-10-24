import { redactENSIndexerConfig } from "@/config/redact";
import {
  UrlString,
  serializeChainId,
  serializeIndexedChainIds,
  serializeUrl,
} from "@ensnode/ensnode-sdk";
import { SerializedENSIndexerConfig } from "./serialized-types";
import type { ENSIndexerConfig } from "./types";

/**
 * Serialize RPC Configs {@link ENSIndexerConfig.rpcConfigs}.
 */
function serializeRpcConfigs(
  rpcConfigs: ENSIndexerConfig["rpcConfigs"],
): SerializedENSIndexerConfig["rpcConfigs"] {
  const serializedRpcConfigs: SerializedENSIndexerConfig["rpcConfigs"] = {};

  for (const [chainId, rpcConfig] of rpcConfigs.entries()) {
    const serializedHttpRPCs = rpcConfig.httpRPCs.map(serializeUrl) as [UrlString, ...UrlString[]]; // guaranteed to include at least one URL
    const serializedWebsocketRPC = rpcConfig.websocketRPC
      ? serializeUrl(rpcConfig.websocketRPC)
      : undefined;

    serializedRpcConfigs[serializeChainId(chainId)] = {
      httpRPCs: serializedHttpRPCs,
      websocketRPC: serializedWebsocketRPC,
    };
  }

  return serializedRpcConfigs;
}

/**
 * Serialize redacted {@link ENSIndexerConfig} object.
 *
 * Guaranteed to have all sensitive values redacted prior serialization.
 */
export function serializeRedactedENSIndexerConfig(
  config: ENSIndexerConfig,
): SerializedENSIndexerConfig {
  const redactedConfig = redactENSIndexerConfig(config);

  return {
    databaseSchemaName: redactedConfig.databaseSchemaName,
    databaseUrl: redactedConfig.databaseUrl,
    ensIndexerUrl: serializeUrl(redactedConfig.ensIndexerUrl),
    ensRainbowUrl: serializeUrl(redactedConfig.ensRainbowUrl),
    labelSet: redactedConfig.labelSet,
    globalBlockrange: redactedConfig.globalBlockrange,
    indexedChainIds: serializeIndexedChainIds(redactedConfig.indexedChainIds),
    isSubgraphCompatible: redactedConfig.isSubgraphCompatible,
    namespace: redactedConfig.namespace,
    plugins: redactedConfig.plugins,
    rpcConfigs: serializeRpcConfigs(redactedConfig.rpcConfigs),
  } satisfies SerializedENSIndexerConfig;
}
