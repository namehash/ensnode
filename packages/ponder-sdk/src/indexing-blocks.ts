import type { BlockNumber } from "./blocks";

export interface ChainIndexingBlocks {
  startBlock: BlockNumber;
  endBlock?: BlockNumber | null;
  backfillEndBlock: BlockNumber;
}
