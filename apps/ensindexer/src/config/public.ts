import type { EnsIndexerPublicConfig } from "@ensnode/ensnode-sdk";

import { getENSRainbowApiClient } from "@/lib/ensraibow-api-client";
import { getENSIndexerVersionInfo } from "@/lib/version-info";

import type { EnsIndexerConfig } from "./types";

const ensRainbowApiClient = getENSRainbowApiClient();

/**
 * Build a public version of {@link EnsIndexerConfig}.
 *
 * Note: some values required to build an {@link EnsIndexerPublicConfig} object
 *       have to fetched over the network.
 */
export async function buildENSIndexerPublicConfig(
  config: EnsIndexerConfig,
): Promise<EnsIndexerPublicConfig> {
  const [versionInfo, ensRainbowPublicConfig] = await Promise.all([
    getENSIndexerVersionInfo(),
    ensRainbowApiClient.config(),
  ]);

  return {
    databaseSchemaName: config.databaseSchemaName,
    ensRainbowPublicConfig,
    labelSet: config.labelSet,
    indexedChainIds: config.indexedChainIds,
    isSubgraphCompatible: config.isSubgraphCompatible,
    namespace: config.namespace,
    plugins: config.plugins,
    versionInfo,
  };
}
