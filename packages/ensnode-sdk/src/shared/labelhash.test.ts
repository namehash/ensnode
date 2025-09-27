import { keccak256, labelhash, stringToBytes } from "viem";
import { describe, expect, it } from "vitest";
import { LiteralLabel, encodeLabelHash } from "../ens";
import { labelhashLiteralLabel } from "./labelhash";

describe("labelhashLiteralLabel", () => {
  it("labelhashes empty string correctly", () => {
    expect(labelhashLiteralLabel("" as LiteralLabel)).toEqual(keccak256(stringToBytes("")));
  });

  it("labelhashes literal label correctly", () => {
    expect(labelhashLiteralLabel("example" as LiteralLabel)).toEqual(labelhash("example"));
  });

  it("labelhashes encoded-labelhash-looking-strings as literal labels", () => {
    const encodedLabelHashLookingLabel = encodeLabelHash(labelhash("whatever")) as LiteralLabel;
    expect(labelhashLiteralLabel(encodedLabelHashLookingLabel)).not.toEqual(
      labelhash(encodedLabelHashLookingLabel),
    );
  });
});
