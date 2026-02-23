import { createIndexingConfig } from "@ensnode/ensnode-sdk";
import type { BlockRef } from "@ensnode/ponder-sdk";

import type { ChainIndexingMetadataImmutable } from "@/lib/indexing-status-builder/chain-indexing-metadata";

/**
 * Build an immutable indexing metadata for a chain.
 *
 * Some of the metadata fields are based on RPC calls to fetch block references.
 *
 * @param startBlock Chain's start block.
 * @param endBlock Chain's end block (optional).
 * @param backfillEndBlock Chain's backfill end block.
 *
 * @returns The immutable indexing metadata for the chain.
 */
export function buildChainIndexingMetadataImmutable(
  startBlock: BlockRef,
  endBlock: BlockRef | null,
  backfillEndBlock: BlockRef,
): ChainIndexingMetadataImmutable {
  const chainIndexingConfig = createIndexingConfig(startBlock, endBlock);

  return {
    backfillScope: {
      startBlock,
      endBlock: backfillEndBlock,
    },
    indexingConfig: chainIndexingConfig,
  };
}
