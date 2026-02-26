import {
  type ContractConfig,
  type DatasourceName,
  type ENSNamespaceId,
  maybeGetDatasource,
} from "@ensnode/datasources";

import type { PluginName } from "../../ensindexer/config/types";
import {
  type BlockNumberRange,
  buildBlockNumberRange,
  mergeBlockNumberRanges,
} from "../blockrange";
import type { ChainId } from "../types";

/**
 * Build a map of indexed block number ranges for each indexed chain,
 * based on the ENSIndexer configuration.
 *
 * Useful for presenting a clear view of the indexed block number ranges
 * across chains.
 */
export function buildIndexedBlockranges(
  namespace: ENSNamespaceId,
  pluginsRequiredDatasourceNames: Map<PluginName, DatasourceName[]>,
): Map<ChainId, BlockNumberRange> {
  const indexedBlockranges = new Map<ChainId, BlockNumberRange>();

  for (const [pluginName, requiredDatasourceNames] of pluginsRequiredDatasourceNames) {
    for (const requiredDatasourceName of requiredDatasourceNames) {
      const requiredDatasource = maybeGetDatasource(namespace, requiredDatasourceName);

      if (!requiredDatasource) {
        throw new Error(
          `Datasource ${requiredDatasourceName} required by plugin ${pluginName} is not defined in namespace ${namespace}.`,
        );
      }

      const datasourceChainId = requiredDatasource.chain.id;
      const datasourceContracts = Object.values<ContractConfig>(requiredDatasource.contracts);

      for (const datasourceContract of datasourceContracts) {
        const currentChainIndexedBlockrange = indexedBlockranges.get(datasourceChainId);
        const { startBlock, endBlock = null } = datasourceContract;

        const contractIndexedBlockrange = buildBlockNumberRange(startBlock, endBlock);

        const indexedBlockrange = currentChainIndexedBlockrange
          ? mergeBlockNumberRanges(currentChainIndexedBlockrange, contractIndexedBlockrange)
          : contractIndexedBlockrange;

        indexedBlockranges.set(datasourceChainId, indexedBlockrange);
      }
    }
  }

  return indexedBlockranges;
}
