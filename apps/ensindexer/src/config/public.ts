import { getDependencyInfo } from "@/lib/version-info";
import type { ENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";
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
  const dependencyInfo = await getDependencyInfo();

  return {
    databaseSchemaName: config.databaseSchemaName,
    ensAdminUrl: config.ensAdminUrl,
    ensNodePublicUrl: config.ensNodePublicUrl,
    labelSet: config.labelSet,
    indexedChainIds: config.indexedChainIds,
    isSubgraphCompatible: config.isSubgraphCompatible,
    namespace: config.namespace,
    plugins: config.plugins,
    dependencyInfo,
  };
}
