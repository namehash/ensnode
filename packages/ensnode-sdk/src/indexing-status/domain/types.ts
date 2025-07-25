import type { ENSNode } from "../../ensnode";
import type { ChainId } from "../../utils";

/**
 * ENSNode namespace: Domain types
 *
 * All types defined in this slice can be arbitrary.
 */

export namespace IndexingStatusDomain {
  /**
   * Block Info
   *
   * Describes a block.
   */
  export interface BlockInfo extends ENSNode.PartialBlockInfo {
    createdAt: Date;
  }

  /**
   * Indexing Status Key
   *
   * A key type used in {@link IndexingStatus}.
   */
  export type IndexingStatusKey = ChainId;

  /**
   * Chain Status
   *
   * A value type used in {@link IndexingStatus}.
   */
  export type ChainStatus = ENSNode.ChainStatus<BlockInfo>;

  /**
   * Indexing Status
   *
   * Represents key-value pairs of Chain ID and Chain Status.
   */
  export type IndexingStatus = Map<IndexingStatusKey, ChainStatus>;
}
