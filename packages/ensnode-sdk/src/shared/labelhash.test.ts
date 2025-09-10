import { labelhash } from "viem";
import { describe, expect, it } from "vitest";
import { LiteralLabel, encodeLabelHash } from "../ens";
import { labelhashLiteralLabel } from "./labelhash";

describe("labelhashLiteralLabel", () => {
  it("labelhashes empty string correctly", () => {
    expect(labelhashLiteralLabel("" as LiteralLabel)).toEqual(labelhash(""));
  });

  it("labelhashes literal label correctly", () => {
    expect(labelhashLiteralLabel("example" as LiteralLabel)).toEqual(labelhash("example"));
  });

  it("labelhashes encoded-labelhash-looking-strings", () => {
    const encodedLabelHashLookingLabel = encodeLabelHash(labelhash("whatever")) as LiteralLabel;
    expect(labelhashLiteralLabel(encodedLabelHashLookingLabel)).not.toEqual(
      labelhash(encodedLabelHashLookingLabel),
    );
  });
});
