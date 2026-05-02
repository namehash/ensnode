import type { ChainId } from "enssdk";
import { zeroAddress } from "viem";

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

/**
 * Build a map of indexed blockranges for each indexed chain, based on the ENSIndexer configuration.
 *
 * Useful for presenting a clear view of the indexed blockranges across chains.
 */
export function buildIndexedBlockranges(
  namespace: ENSNamespaceId,
  pluginsDatasourceNames: Map<PluginName, DatasourceName[]>,
): Map<ChainId, BlockNumberRangeWithStartBlock> {
  const indexedBlockranges = new Map<ChainId, BlockNumberRangeWithStartBlock>();

  for (const [, datasourceNames] of pluginsDatasourceNames) {
    for (const datasourceName of datasourceNames) {
      const datasource = maybeGetDatasource(namespace, datasourceName);

      // skip datasources not defined in this namespace, mirroring derive_indexedChainIds logic
      if (!datasource) continue;

      const datasourceChainId = datasource.chain.id;
      const datasourceContracts = Object.values<ContractConfig>(datasource.contracts);

      for (const datasourceContract of datasourceContracts) {
        // Skip placeholder contracts that exist only to satisfy the typesystem
        // (e.g. cross-namespace registrar entries set to the zero address). They
        // are not actually indexed by Ponder, so including their startBlock=0
        // would incorrectly drag the chain's indexed blockrange lower bound to 0.
        if (datasourceContract.address === zeroAddress) continue;

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
