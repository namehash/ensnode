import type { ENSNode } from "../../types";
import type { UnixTimestamp } from "../../utils/types";

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
    createdAt: UnixTimestamp;
  }

  export type IndexingStatus = {
    [chainId: string]: ENSNode.ChainStatus<BlockInfo>;
  };
}
