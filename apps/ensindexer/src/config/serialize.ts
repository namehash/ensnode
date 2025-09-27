import { serializeChainId, serializeIndexedChainIds, serializeUrl } from "@ensnode/ensnode-sdk";
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
    serializedRpcConfigs[serializeChainId(chainId)] = {
      maxRequestsPerSecond: rpcConfig.maxRequestsPerSecond,
      url: serializeUrl(rpcConfig.url),
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
    const redactedRpcUrl = new URL(`/${REDACTED}`, rpcConfig.url.href);

    redactedRpcConfigs.set(chainId, {
      ...rpcConfig,
      url: redactedRpcUrl,
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
    ensAdminUrl: serializeUrl(redactedConfig.ensAdminUrl),
    ensNodePublicUrl: serializeUrl(redactedConfig.ensNodePublicUrl),
    ensIndexerUrl: serializeUrl(redactedConfig.ensIndexerUrl),
    ensRainbowUrl: serializeUrl(redactedConfig.ensRainbowUrl),
    labelSet: redactedConfig.labelSet,
    globalBlockrange: redactedConfig.globalBlockrange,
    indexedChainIds: serializeIndexedChainIds(redactedConfig.indexedChainIds),
    isSubgraphCompatible: redactedConfig.isSubgraphCompatible,
    namespace: redactedConfig.namespace,
    plugins: redactedConfig.plugins,
    port: redactedConfig.port,
    rpcConfigs: serializeRpcConfigs(redactedConfig.rpcConfigs),
  } satisfies SerializedENSIndexerConfig;
}
