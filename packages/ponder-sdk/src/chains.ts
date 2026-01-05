/**
 * Ponder SDK: Chains
 *
 * This file describes ideas and functionality related to metadata about chains
 * indexing status.
 */

import type { BlockRef } from "./block-refs";
import type { DeepPartial } from "./shared";

/**
 * Chain ID
 *
 * Represents a unique identifier for a chain.
 * Guaranteed to be a positive integer.
 **/
export type ChainId = number;

/**
 * Serialized representation of {@link ChainId}.
 **/
export type ChainIdString = string;

/**
 * Ponder Status Chain
 */
export interface PonderStatusChain {
  /** Chain ID */
  id: ChainId;

  /** Latest Indexed Block Ref */
  block: BlockRef;
}

/**
 * Chain Metadata
 *
 * Represents metadata about an indexed chain.
 */
export interface ChainMetadata {
  chainId: ChainId;

  /**
   * Historical Total Blocks
   *
   * Blocks count to be process during backfill.
   */
  historicalTotalBlocks: number;

  /**
   * Is Sync Complete?
   *
   * Tells if the backfill has finished.
   */
  isSyncComplete: boolean;

  /**
   * Is Sync Realtime?
   *
   * Tells if there's ongoing indexing following the backfill.
   */
  isSyncRealtime: boolean;

  /**
   * Ponder blocks config
   *
   * Based on ponder.config.ts output.
   */
  config: {
    startBlock: BlockRef;

    endBlock: BlockRef | null;
  };

  /**
   * Backfill end block
   *
   * The block at which the backfill will end.
   */
  backfillEndBlock: BlockRef;

  /**
   * Sync block
   *
   * The latest block stored in the RPC cache.
   */
  syncBlock: BlockRef;

  /**
   * Status block
   *
   * Either:
   * - the first block to be indexed, or
   * - the last indexed block,
   * for the chain.
   */
  statusBlock: BlockRef;
}

/**
 * Unvalidated representation of {@link ChainMetadata}.
 */
export type UnvalidatedChainMetadata = DeepPartial<ChainMetadata>;
