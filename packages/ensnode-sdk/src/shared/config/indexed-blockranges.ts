import {
  type ContractConfig,
  type DatasourceName,
  type ENSNamespaceId,
  maybeGetDatasource,
} from "@ensnode/datasources";

import type { PluginName } from "../../ensindexer/config/types";
import {
  type BlockNumberRangeWithStartBlock,
  buildBlockNumberRange,
  mergeBlockNumberRanges,
  RangeTypeIds,
} from "../blockrange";
import type { ChainId } from "../types";

/**
 * Build a map of indexed blockranges for each indexed chain,
 * based on the ENSIndexer configuration.
 *
 * Useful for presenting a clear view of the indexed blockranges
 * across chains.
 */
export function buildIndexedBlockranges(
  namespace: ENSNamespaceId,
  pluginsRequiredDatasourceNames: Map<PluginName, DatasourceName[]>,
): Map<ChainId, BlockNumberRangeWithStartBlock> {
  const indexedBlockranges = new Map<ChainId, BlockNumberRangeWithStartBlock>();

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

        const contractIndexedBlockrange = buildBlockNumberRange(
          datasourceContract.startBlock,
          datasourceContract.endBlock,
        );

        const indexedBlockrange = currentChainIndexedBlockrange
          ? mergeBlockNumberRanges(currentChainIndexedBlockrange, contractIndexedBlockrange)
          : contractIndexedBlockrange;

        if (
          indexedBlockrange.rangeType !== RangeTypeIds.LeftBounded &&
          indexedBlockrange.rangeType !== RangeTypeIds.Bounded
        ) {
          throw new Error(
            `Indexed blockrange for chain ${datasourceChainId} is expected to be left-bounded or bounded, but got ${indexedBlockrange.rangeType}.`,
          );
        }

        indexedBlockranges.set(datasourceChainId, indexedBlockrange);
      }
    }
  }

  return indexedBlockranges;
}
