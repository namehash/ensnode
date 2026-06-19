import type { ChainId } from "enssdk";

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
  chainEndBlocks: ReadonlyMap<ChainId, number>,
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
      const chainEndBlock = chainEndBlocks.get(datasourceChainId);

      for (const datasourceContract of datasourceContracts) {
        const currentChainIndexedBlockrange = indexedBlockranges.get(datasourceChainId);

        if (typeof chainEndBlock === "number" && datasourceContract.startBlock > chainEndBlock) {
          // If the contract's start block is greater than the chain's end block,
          // then this contract is not indexed at all, so we can skip it from
          // consideration in the indexed blockrange.
          continue;
        }

        // The chain's end block caps the contract's range: index up to whichever bound comes first
        // (the contract's own endBlock or the chain's). This mirrors `constrainBlockrange` on the
        // Ponder config path, so the derived view never reports a range exceeding the checkpoint.
        const effectiveEndBlock = Math.min(
          datasourceContract.endBlock ?? Infinity,
          chainEndBlock ?? Infinity,
        );
        const contractIndexedBlockrange = buildBlockNumberRange(
          datasourceContract.startBlock,
          Number.isFinite(effectiveEndBlock) ? effectiveEndBlock : undefined,
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
