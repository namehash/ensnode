import { makePluginNamespace } from "@/lib/plugin-helpers";
import { describe, expect, it } from "vitest";

describe("createPluginNamespace", () => {
  it("should return a function that creates namespaced contract names", () => {
    const boxNs = makePluginNamespace("box");
    const rootNs = makePluginNamespace("root");
    const basenamesNes = makePluginNamespace("basenames");

    expect(boxNs("Registry")).toBe("box/Registry");
    expect(rootNs("Registry")).toBe("root/Registry");
    expect(basenamesNes("Registry")).toBe("basenames/Registry");
  });

  it("should throw if invalid characters", () => {
    expect(() => makePluginNamespace("root.test")).toThrowError(/reserved/i);
    expect(() => makePluginNamespace("root:test")).toThrowError(/reserved/i);
  });
});
