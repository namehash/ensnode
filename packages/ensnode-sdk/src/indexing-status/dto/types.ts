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
  export interface BlockInfo extends ENSNode.PartialBlockInfo {
    createdAt: DatetimeIso8601 | null;
  }

  export type IndexingStatusKey = string;

  export type ChainStatus = ENSNode.ChainStatus<BlockInfo>;

  export type IndexingStatus = {
    [chainId: IndexingStatusKey]: ChainStatus;
  };
}
