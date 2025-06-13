import { beforeEach, describe, expect, it } from "vitest";
import { setupConfigMock } from "./utils/mockConfig";
setupConfigMock(); // setup config mock before importing dependent modules

import { ENSIndexerConfig } from "@/config/types";
import { constrainContractBlockrange, makePluginNamespace } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/ensnode-sdk";

describe("plugin helpers", () => {
  describe("createPluginNamespace", () => {
    it("should return a function that creates namespaced contract names", () => {
      const boxNs = makePluginNamespace("box" as PluginName);
      const subgraphNs = makePluginNamespace(PluginName.Subgraph);
      const basenamesNes = makePluginNamespace(PluginName.Basenames);

      expect(boxNs("Registry")).toBe("box/Registry");
      expect(subgraphNs("Registry")).toBe("subgraph/Registry");
      expect(basenamesNes("Registry")).toBe("basenames/Registry");
    });

    it("should throw if invalid characters", () => {
      expect(() => makePluginNamespace("subgraph.test" as PluginName)).toThrowError(/reserved/i);
      expect(() => makePluginNamespace("subgraph:test" as PluginName)).toThrowError(/reserved/i);
    });
  });

  describe("constrainContractBlockrange", () => {
    /**
     * Create config object including `globalBlockrange` value
     * @param startBlock
     * @param endBlock
     * @returns config object
     */
    function createConfigWithGlobalBlockrange(
      startBlock?: ENSIndexerConfig["globalBlockrange"]["startBlock"],
      endBlock?: ENSIndexerConfig["globalBlockrange"]["endBlock"],
    ): Pick<ENSIndexerConfig, "globalBlockrange"> {
      return {
        globalBlockrange: {
          startBlock,
          endBlock,
        },
      } satisfies Pick<ENSIndexerConfig, "globalBlockrange">;
    }

    describe("without global range", () => {
      it("should return valid startBlock and endBlock", () => {
        const range = constrainContractBlockrange(createConfigWithGlobalBlockrange(), 5);
        expect(range).toEqual({ startBlock: 5, endBlock: undefined });
      });

      it("should handle undefined contractStartBlock", () => {
        const range = constrainContractBlockrange(createConfigWithGlobalBlockrange(), undefined);
        expect(range).toEqual({ startBlock: 0, endBlock: undefined });
      });
    });

    describe("with global range", () => {
      it("should respect global end block", () => {
        const config = constrainContractBlockrange(
          createConfigWithGlobalBlockrange(undefined, 1234),
          5,
        );
        expect(config).toEqual({ startBlock: 5, endBlock: 1234 });
      });

      it("should handle undefined contract start block", () => {
        const config = constrainContractBlockrange(
          createConfigWithGlobalBlockrange(undefined, 1234),
          undefined,
        );
        expect(config).toEqual({ startBlock: 0, endBlock: 1234 });
      });

      it("should use contract start block if later than global start", () => {
        const config = constrainContractBlockrange(createConfigWithGlobalBlockrange(10, 1234), 20);
        expect(config).toEqual({ startBlock: 20, endBlock: 1234 });
      });

      it("should use global start block if later than contract start", () => {
        const config = constrainContractBlockrange(createConfigWithGlobalBlockrange(30, 1234), 20);
        expect(config).toEqual({ startBlock: 30, endBlock: 1234 });
      });
    });
  });
});
