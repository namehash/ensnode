import { labelhash, namehash } from "viem";
import { describe, expect, it } from "vitest";

import { makeSubdomainNode } from "./subname-helpers";

describe("makeSubdomainNode", () => {
  it("should return the correct namehash for a subnode", () => {
    expect(makeSubdomainNode(labelhash("test🚀"), namehash("base.eth"))).toBe(
      namehash("test🚀.base.eth"),
    );
  });
});
