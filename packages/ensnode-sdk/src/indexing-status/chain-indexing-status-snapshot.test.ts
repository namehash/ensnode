import { describe, expect, it } from "vitest";

import { earlierBlockRef, laterBlockRef } from "./block-refs.mock";
import {
  type BlockRefRangeDefinite,
  type BlockRefRangeIndefinite,
  BlockRefRangeTypeIds,
  createIndexingConfig,
} from "./chain-indexing-status-snapshot";

describe("Chain Indexing Status Snapshot", () => {
  describe("createIndexingConfig", () => {
    it("returns 'definite' indexer config if the endBlock exists", () => {
      // arrange
      const startBlock = earlierBlockRef;
      const endBlock = laterBlockRef;

      // act
      const indexingConfig = createIndexingConfig(startBlock, endBlock);

      // assert
      expect(indexingConfig).toStrictEqual({
        blockRangeType: BlockRefRangeTypeIds.Definite,
        startBlock: earlierBlockRef,
        endBlock: laterBlockRef,
      } satisfies BlockRefRangeDefinite);
    });

    it("returns 'indefinite' indexer config if the endBlock does not exist", () => {
      // arrange
      const startBlock = earlierBlockRef;
      const endBlock = null;

      // act
      const indexingConfig = createIndexingConfig(startBlock, endBlock);

      // assert
      expect(indexingConfig).toStrictEqual({
        blockRangeType: BlockRefRangeTypeIds.Indefinite,
        startBlock: earlierBlockRef,
      } satisfies BlockRefRangeIndefinite);
    });
  });
});
