import {
  type ContractConfig,
  type DatasourceName,
  type ENSNamespaceId,
  maybeGetDatasource,
} from "@ensnode/datasources";

import type { PluginName } from "../../ensindexer/config/types";
import { mergeBlockranges } from "../blockrange";
import type { BlockrangeWithStartBlock, ChainId } from "../types";

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
): Map<ChainId, BlockrangeWithStartBlock> {
  const indexedBlockranges = new Map<ChainId, BlockrangeWithStartBlock>();

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

        const contractIndexedBlockrange = {
          startBlock: datasourceContract.startBlock,
          endBlock: datasourceContract.endBlock,
        };

        const indexedBlockrange = currentChainIndexedBlockrange
          ? mergeBlockranges(currentChainIndexedBlockrange, contractIndexedBlockrange)
          : contractIndexedBlockrange;

        indexedBlockranges.set(datasourceChainId, indexedBlockrange);
      }
    }
  }

  return indexedBlockranges;
}
