import { describe, expect, it } from "vitest";
import { setupConfigMock } from "./utils/mockConfig";
setupConfigMock(); // setup config mock before importing dependent modules

import { makePluginNamespace } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/ensnode-sdk";

describe("makePluginNamespace", () => {
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
