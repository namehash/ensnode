import { describe, expect, it } from "vitest";

import { beautifyInterpretedName } from "./beautify";
import { ENS_ROOT_NAME } from "./constants";
import { asInterpretedName } from "./interpreted-names-and-labels";

describe("beautifyInterpretedName", () => {
  it("returns the ENS Root Name unchanged", () => {
    expect(beautifyInterpretedName(ENS_ROOT_NAME)).toEqual(ENS_ROOT_NAME);
  });

  it("beautifies normalized labels", () => {
    const name = asInterpretedName("♾♾♾♾.eth");
    expect(beautifyInterpretedName(name)).toEqual("♾️♾️♾️♾️.eth");
  });

  it("preserves Encoded LabelHash labels verbatim", () => {
    const name = asInterpretedName(
      "[0000000000000000000000000000000000000000000000000000000000000001].eth",
    );
    expect(beautifyInterpretedName(name)).toEqual(
      "[0000000000000000000000000000000000000000000000000000000000000001].eth",
    );
  });

  it("selectively beautifies labels alongside Encoded LabelHash labels", () => {
    const name = asInterpretedName(
      "♾♾♾♾.[0000000000000000000000000000000000000000000000000000000000000001].eth",
    );
    expect(beautifyInterpretedName(name)).toEqual(
      "♾️♾️♾️♾️.[0000000000000000000000000000000000000000000000000000000000000001].eth",
    );
  });
});
