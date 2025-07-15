import type { ENSNode } from "../../ensnode";
import type { ChainId, DatetimeIso8601 } from "../../utils/types";

/**
 * ENSNode namespace: DTO types
 *
 * All types defined in this slice of the {@link ENSNode} namespace
 * must be 100% compatible input for {@link JSON.stringify} function.
 *
 * They will have to cover all {@link ENSNode.Domain} types that
 * cannot be automatically serialized into a JSON string.
 */
export namespace IndexingStatusDTO {
  /**
   * Block Info
   *
   * Describes a block.
   */
  export interface BlockInfo extends ENSNode.PartialBlockInfo {
    createdAt: DatetimeIso8601 | null;
  }

  /**
   * Indexing Status Key
   *
   * A key type used in {@link IndexingStatus}.
   */
  export type IndexingStatusKey = string;

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
  export type IndexingStatus = {
    [chainId: IndexingStatusKey]: ChainStatus;
  };
}
