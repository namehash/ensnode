import { describe, expect, it } from "vitest";
import { isSubgraphCompatible } from "./helpers";
import { PluginNames } from "./types";

describe("ENSIndexer: Config helpers", () => {
  describe("isSubgraphCompatible", () => {
    it(`returns 'true' when only the '${PluginNames.Subgraph}' plugin is active and no extended indexing features are on`, () => {
      expect(
        isSubgraphCompatible({
          healReverseAddresses: false,
          indexAdditionalResolverRecords: false,
          plugins: [PluginNames.Subgraph],
        }),
      ).toBe(true);
    });

    it(`returns 'false' when active plugins are something else than just '${PluginNames.Subgraph}'`, () => {
      expect(
        isSubgraphCompatible({
          healReverseAddresses: false,
          indexAdditionalResolverRecords: false,
          plugins: [],
        }),
      ).toBe(false);

      expect(
        isSubgraphCompatible({
          healReverseAddresses: false,
          indexAdditionalResolverRecords: false,
          plugins: [PluginNames.Subgraph, PluginNames.Lineanames],
        }),
      ).toBe(false);
    });

    it(`returns 'false' when 'healReverseAddresses' is set to 'true'`, () => {
      expect(
        isSubgraphCompatible({
          healReverseAddresses: true,
          indexAdditionalResolverRecords: false,
          plugins: [PluginNames.Subgraph],
        }),
      ).toBe(false);
    });

    it(`returns 'false' when 'indexAdditionalResolverRecords' is set to 'true'`, () => {
      expect(
        isSubgraphCompatible({
          healReverseAddresses: false,
          indexAdditionalResolverRecords: true,
          plugins: [PluginNames.Subgraph],
        }),
      ).toBe(false);
    });
  });
});
