import type { ENSIndexerConfig } from "@/config/types";
import { getDependencyInfo } from "@/lib/version-info";
import {
  type DependencyInfo,
  type ENSIndexerPublicConfig,
  serializeENSIndexerPublicConfig,
} from "@ensnode/ensnode-sdk";

/**
 * Build a public version of {@link ENSIndexerConfig},
 * including {@link DependencyInfo}.
 */
export function buildENSIndexerPublicConfig(
  config: ENSIndexerConfig,
  dependencyInfo: DependencyInfo,
): ENSIndexerPublicConfig {
  return {
    databaseSchemaName: config.databaseSchemaName,
    ensAdminUrl: config.ensAdminUrl,
    ensNodePublicUrl: config.ensNodePublicUrl,
    ensRainbowUrl: config.ensRainbowUrl,
    experimentalResolution: config.experimentalResolution,
    healReverseAddresses: config.healReverseAddresses,
    indexAdditionalResolverRecords: config.indexAdditionalResolverRecords,
    indexedChainIds: config.indexedChainIds,
    isSubgraphCompatible: config.isSubgraphCompatible,
    namespace: config.namespace,
    plugins: config.plugins,
    dependencyInfo,
  };
}

/**
 * Redact sensitive values for {@link ENSIndexerConfig}.
 */
export function redactENSIndexerConfig(config: ENSIndexerConfig): ENSIndexerConfig {
  const REDACTED = "*****";

  // redact database URL
  const redactedDatabaseUrl = REDACTED;

  // redact RPC configs (including RPC URLs)
  const redactedRpcConfigs: ENSIndexerConfig["rpcConfigs"] = {};

  for (const [chainId, rpcConfig] of Object.entries(config.rpcConfigs)) {
    const redactedRpcUrl = new URL(`/${REDACTED}`, rpcConfig.url.href);

    redactedRpcConfigs[chainId] = {
      ...rpcConfig,
      url: redactedRpcUrl,
    };
  }

  return {
    ...config,
    databaseUrl: redactedDatabaseUrl,
    rpcConfigs: redactedRpcConfigs,
  };
}

/**
 * A replacer function to be used with `JSON.stringify` for
 * {@link ENSIndexerConfig} object.
 *
 * It truncates the ABI objects that otherwise would become very long strings,
 * and serializes URL objects.
 */
function ENSIndexerConfigJSONReplacer(key: string, value: unknown) {
  // stringify a URL object
  if (value instanceof URL) {
    return value.href;
  }

  // truncate ABI value
  if (key === "abi") {
    return `(truncated ABI output)`;
  }

  // pass-through value
  return value;
}

/**
 * Pretty print {@link ENSIndexerConfig} object in a non-blocking way.
 *
 * Invariant:
 * - All sensitive values are redacted before printing a string representation
 *   of the config into stdout.
 */
export async function prettyPrintConfig(config: ENSIndexerConfig): Promise<void> {
  // Redact sensitive values from ENSIndexerConfig object.
  const redactedConfig = redactENSIndexerConfig(config);

  // Fetch the current state of dependency info.
  const dependencyInfo = await getDependencyInfo();

  // Create public config object.
  const publicConfig = buildENSIndexerPublicConfig(redactedConfig, dependencyInfo);

  // Serialize public config object.
  const serializedPublicConfig = serializeENSIndexerPublicConfig(publicConfig);

  // Merge redacted ENSIndexerConfig object, and override common property values
  // with the ones coming from SerializedENSIndexerPublicConfig object.
  // Thanks to that, we can print also properties that part of ENSIndexerConfig,
  // but are not included in SerializedENSIndexerPublicConfig.
  const configToBePrinted = { ...redactedConfig, ...serializedPublicConfig };

  // Stringify configToBePrinted using special replacer function.
  const configString = JSON.stringify(configToBePrinted, ENSIndexerConfigJSONReplacer, 2);

  // Finally, print the stringified config into stdout.
  console.log(`ENSIndexer running with config:\n${configString}`);
}
