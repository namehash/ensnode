import { makePluginNamespace } from "@/lib/plugin-helpers";
import { PluginName } from "@ensnode/utils";
import { describe, expect, it } from "vitest";

describe("createPluginNamespace", () => {
  it("should return a function that creates namespaced contract names", () => {
    const boxNs = makePluginNamespace("box" as PluginName);
    const rootNs = makePluginNamespace(PluginName.Root);
    const basenamesNes = makePluginNamespace(PluginName.Basenames);

    expect(boxNs("Registry")).toBe("box/Registry");
    expect(rootNs("Registry")).toBe("root/Registry");
    expect(basenamesNes("Registry")).toBe("basenames/Registry");
  });

  it("should throw if invalid characters", () => {
    expect(() => makePluginNamespace("root.test" as PluginName)).toThrowError(/reserved/i);
    expect(() => makePluginNamespace("root:test" as PluginName)).toThrowError(/reserved/i);
  });
});
