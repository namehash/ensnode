import { describe, expect, it } from "vitest";

import { earlierBlockRef, laterBlockRef } from "./block-refs.mock";
import {
  type ChainIndexingConfigDefinite,
  type ChainIndexingConfigIndefinite,
  ChainIndexingConfigTypeIds,
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
        configType: ChainIndexingConfigTypeIds.Definite,
        startBlock: earlierBlockRef,
        endBlock: laterBlockRef,
      } satisfies ChainIndexingConfigDefinite);
    });

    it("returns 'indefinite' indexer config if the endBlock exists", () => {
      // arrange
      const startBlock = earlierBlockRef;
      const endBlock = null;

      // act
      const indexingConfig = createIndexingConfig(startBlock, endBlock);

      // assert
      expect(indexingConfig).toStrictEqual({
        configType: ChainIndexingConfigTypeIds.Indefinite,
        startBlock: earlierBlockRef,
      } satisfies ChainIndexingConfigIndefinite);
    });
  });
});
