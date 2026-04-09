import { describe, expect, it } from "vitest";

import { asInterpretedLabel, asInterpretedName } from "./interpreted-names-and-labels";
import { labelhashInterpretedLabel } from "./labelhash";
import { makeSubdomainNode, namehashInterpretedName } from "./namehash";

describe("makeSubdomainNode", () => {
  it("should return the correct namehash for a subnode", () => {
    expect(
      makeSubdomainNode(
        labelhashInterpretedLabel(asInterpretedLabel("test🚀")),
        namehashInterpretedName(asInterpretedName("base.eth")),
      ),
    ).toBe(namehashInterpretedName(asInterpretedName("test🚀.base.eth")));
  });
});
