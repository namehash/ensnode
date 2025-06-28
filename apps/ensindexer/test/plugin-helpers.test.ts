import { describe, expect, it } from "vitest";

import { makePluginNamespace } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/ensnode-sdk";

describe("plugin helpers", () => {
  describe("createPluginNamespace", () => {
    it("should return a function that creates namespaced contract names", () => {
      const threednsNs = makePluginNamespace(PluginName.ThreeDNS);
      const subgraphNs = makePluginNamespace(PluginName.Subgraph);
      const basenamesNes = makePluginNamespace(PluginName.Basenames);

      expect(threednsNs("Registry")).toBe("threedns/Registry");
      expect(subgraphNs("Registry")).toBe("subgraph/Registry");
      expect(basenamesNes("Registry")).toBe("basenames/Registry");
    });

    it("should throw if invalid characters", () => {
      expect(() => makePluginNamespace("subgraph.test" as PluginName)).toThrowError(/reserved/i);
      expect(() => makePluginNamespace("subgraph:test" as PluginName)).toThrowError(/reserved/i);
    });
  });
});
