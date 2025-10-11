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
 * Redact sensitive values for {@link ENSIndexerConfig}.
 */
function redactENSIndexerConfig(config: ENSIndexerConfig): ENSIndexerConfig {
  const REDACTED = "*****";

  // redact database URL
  const redactedDatabaseUrl = REDACTED;

  // redact RPC configs (including RPC URLs)
  const redactedRpcConfigs: ENSIndexerConfig["rpcConfigs"] = new Map();

  for (const [chainId, rpcConfig] of config.rpcConfigs.entries()) {
    const redactURL = (sourceURL: URL) => new URL(`/${REDACTED}`, sourceURL.href);

    const redactedHttpRPCs = rpcConfig.httpRPCs.map(redactURL) as [URL, ...URL[]]; // guaranteed to include at least one URL
    const redactedWebsocketRPC = rpcConfig.websocketRPC
      ? redactURL(rpcConfig.websocketRPC)
      : undefined;

    redactedRpcConfigs.set(chainId, {
      httpRPCs: redactedHttpRPCs,
      websocketRPC: redactedWebsocketRPC,
    });
  }

  return {
    ...config,
    databaseUrl: redactedDatabaseUrl,
    rpcConfigs: redactedRpcConfigs,
  };
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
