import { makePluginNamespace } from "@/lib/plugin-helpers";
import { describe, expect, it } from "vitest";

describe("createPluginNamespace", () => {
  it("should return a function that creates namespaced contract names", () => {
    const boxNs = makePluginNamespace("box");
    const ethNs = makePluginNamespace("eth");
    const baseEthNs = makePluginNamespace("base");

    expect(boxNs("Registry")).toBe("box/Registry");
    expect(ethNs("Registry")).toBe("eth/Registry");
    expect(baseEthNs("Registry")).toBe("base/Registry");
  });

  it("should throw if invalid characters", () => {
    expect(() => makePluginNamespace("eth.test")).toThrowError(/reserved/i);
    expect(() => makePluginNamespace("eth:test")).toThrowError(/reserved/i);
  });
});
