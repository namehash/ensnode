import { createPluginNamespace } from "@/lib/plugin-helpers";
import { describe, expect, it } from "vitest";

describe("createPluginNamespace", () => {
  it("should return a function that creates namespaced contract names", () => {
    const boxNs = createPluginNamespace("box");
    const ethNs = createPluginNamespace("eth");
    const baseEthNs = createPluginNamespace("base.eth");
    const nestedNs = createPluginNamespace("well.done.sir.eth");

    expect(boxNs("Registry")).toBe("/box/Registry");
    expect(ethNs("Registry")).toBe("/eth/Registry");
    expect(baseEthNs("Registry")).toBe("/eth/base/Registry");
    expect(nestedNs("Registry")).toBe("/eth/sir/done/well/Registry");
  });
});
