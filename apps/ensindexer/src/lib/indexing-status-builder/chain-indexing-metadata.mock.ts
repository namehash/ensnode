import { type BlockRefRange, BlockRefRangeTypeIds } from "@ensnode/ensnode-sdk";
import type {
  BlockRef,
  ChainIndexingMetrics,
  ChainIndexingMetricsCompleted,
  ChainIndexingMetricsHistorical,
  ChainIndexingMetricsRealtime,
  ChainIndexingState,
} from "@ensnode/ponder-sdk";
import { ChainIndexingStates } from "@ensnode/ponder-sdk";

import type { BackfillScope } from "./backfill-scope";
import type { ChainIndexingMetadata } from "./chain-indexing-metadata";

/**
 * Build complete indexing metadata for a chain, used for testing the indexing
 * status snapshot builders.
 *
 * @param config - The chain indexing configuration, including backfill scope.
 * @param checkpointBlock - The block ref representing the current checkpoint of
 *                          indexing.
 * @param state - The current state of indexing (Historical, Realtime, Completed).
 * @param latestSyncedBlock - The latest block ref that has been synced (used for
 *                            Realtime state).
 * @param backfillEndBlock - The block ref representing the end of the backfill
 *                           scope (used for Historical state).
 *
 * @returns Complete indexing metadata for the chain.
 */
export function buildChainIndexingMetadataMock({
  config,
  checkpointBlock,
  state,
  latestSyncedBlock,
  backfillEndBlock,
}: {
  config: BlockRefRange;
  checkpointBlock: BlockRef;
  state: ChainIndexingState;
  latestSyncedBlock: BlockRef;
  backfillEndBlock: BlockRef;
}): ChainIndexingMetadata {
  // assuming historical total blocks as
  // `latestBlockRef.number - config.startBlock.number + 1` for the sake of
  // this mock, since we don't have real metrics to determine
  // the actual end block for historical indexing.
  const historicalTotalBlocks = backfillEndBlock.number - config.startBlock.number + 1;

  const backfillScope = {
    startBlock: config.startBlock,
    endBlock:
      config.blockRangeType === BlockRefRangeTypeIds.Definite ? config.endBlock : backfillEndBlock,
  } satisfies BackfillScope;

  let indexingMetrics: ChainIndexingMetrics;

  switch (state) {
    case ChainIndexingStates.Historical:
      indexingMetrics = {
        state: ChainIndexingStates.Historical,
        latestSyncedBlock,
        historicalTotalBlocks,
      } satisfies ChainIndexingMetricsHistorical;
      break;
    case ChainIndexingStates.Realtime:
      indexingMetrics = {
        state: ChainIndexingStates.Realtime,
        latestSyncedBlock: latestSyncedBlock,
      } satisfies ChainIndexingMetricsRealtime;
      break;
    case ChainIndexingStates.Completed:
      indexingMetrics = {
        state: ChainIndexingStates.Completed,
        finalIndexedBlock: checkpointBlock,
      } satisfies ChainIndexingMetricsCompleted;
      break;
  }

  return {
    backfillScope,
    indexingConfig: config,
    indexingMetrics,
    indexingStatus: { checkpointBlock },
  };
}
