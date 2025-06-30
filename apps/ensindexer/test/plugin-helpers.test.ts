import { describe, expect, it } from "vitest";

import { namespaceContract } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/ensnode-sdk";

describe("plugin helpers", () => {
  describe("createPluginNamespace", () => {
    it("should return a function that creates namespaced contract names", () => {
      expect(namespaceContract(PluginName.ThreeDNS, "Registry")).toBe("threedns/Registry");
      expect(namespaceContract(PluginName.Subgraph, "Registry")).toBe("subgraph/Registry");
      expect(namespaceContract(PluginName.Basenames, "Registry")).toBe("basenames/Registry");
    });

    it("should throw if invalid characters", () => {
      expect(() => namespaceContract("subgraph.test", "Registry")).toThrowError(/reserved/i);
      expect(() => namespaceContract("subgraph:test", "Registry")).toThrowError(/reserved/i);
    });
  });
});
