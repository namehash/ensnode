import { describe, expect, it } from "vitest";
import { isSubgraphCompatible } from "./helpers";
import { PluginName } from "./types";

describe("ENSIndexer: Config helpers", () => {
  describe("isSubgraphCompatible", () => {
    const subgraphCompatibleLabelSet = {
      labelSetId: "subgraph" as const,
      labelSetVersion: 0,
    };

    it(`returns 'true' when only the '${PluginName.Subgraph}' plugin is active, no extended indexing features are on, and label set is subgraph/0`, () => {
      expect(
        isSubgraphCompatible({
          plugins: [PluginName.Subgraph],
          labelSet: subgraphCompatibleLabelSet,
        }),
      ).toBe(true);
    });

    it(`returns 'false' when active plugins are something else than just '${PluginName.Subgraph}'`, () => {
      expect(
        isSubgraphCompatible({
          plugins: [],
          labelSet: subgraphCompatibleLabelSet,
        }),
      ).toBe(false);

      expect(
        isSubgraphCompatible({
          plugins: [PluginName.Subgraph, PluginName.Lineanames],
          labelSet: subgraphCompatibleLabelSet,
        }),
      ).toBe(false);
    });

    it(`returns 'false' when label set id is not 'subgraph'`, () => {
      expect(
        isSubgraphCompatible({
          plugins: [PluginName.Subgraph],
          labelSet: {
            labelSetId: "other-label-set",
            labelSetVersion: 0,
          },
        }),
      ).toBe(false);
    });

    it(`returns 'false' when label set version is not 0`, () => {
      expect(
        isSubgraphCompatible({
          plugins: [PluginName.Subgraph],
          labelSet: {
            labelSetId: "subgraph",
            labelSetVersion: 1,
          },
        }),
      ).toBe(false);
    });
  });
});
