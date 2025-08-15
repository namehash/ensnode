import { describe, expect, it } from "vitest";

import { namespaceContract } from "@/lib/plugin-helpers";
import { PluginNames } from "@ensnode/ensnode-sdk";

describe("plugin helpers", () => {
  describe("createPluginNamespace", () => {
    it("should return a function that creates namespaced contract names", () => {
      expect(namespaceContract(PluginNames.ThreeDNS, "Registry")).toBe("threedns/Registry");
      expect(namespaceContract(PluginNames.Subgraph, "Registry")).toBe("subgraph/Registry");
      expect(namespaceContract(PluginNames.Basenames, "Registry")).toBe("basenames/Registry");
    });

    it("should throw if invalid characters", () => {
      expect(() => namespaceContract("subgraph.test", "Registry")).toThrowError(/reserved/i);
      expect(() => namespaceContract("subgraph:test", "Registry")).toThrowError(/reserved/i);
    });
  });
});
