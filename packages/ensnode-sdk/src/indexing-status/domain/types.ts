import type { ENSNode } from "../../ensnode";
import type { ChainId } from "../../utils";

/**
 * ENSNode namespace: Domain types
 *
 * All types defined in this slice can be arbitrary.
 */

export namespace IndexingStatusDomain {
  export interface BlockInfo extends ENSNode.PartialBlockInfo {
    createdAt: Date;
  }

  export type ChainStatus = ENSNode.ChainStatus<BlockInfo>;

  /**
   * Indexing Status
   *
   * Represents key-value pairs of Chain ID and Chain Status.
   */
  export type IndexingStatus = Map<ChainId, ChainStatus>;
}
