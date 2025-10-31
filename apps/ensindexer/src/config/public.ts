import type { ENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";

import { getENSIndexerVersionInfo } from "@/lib/version-info";

import type { ENSIndexerConfig } from "./types";

/**
 * Build a public version of {@link ENSIndexerConfig}.
 *
 * Note: some values required to build an {@link ENSIndexerPublicConfig} object
 *       have to fetched over the network.
 */
export async function buildENSIndexerPublicConfig(
  config: ENSIndexerConfig,
): Promise<ENSIndexerPublicConfig> {
  const versionInfo = await getENSIndexerVersionInfo();

  return {
    databaseSchemaName: config.databaseSchemaName,
    labelSet: config.labelSet,
    indexedChainIds: config.indexedChainIds,
    isSubgraphCompatible: config.isSubgraphCompatible,
    namespace: config.namespace,
    plugins: config.plugins,
    versionInfo,
  };
}
