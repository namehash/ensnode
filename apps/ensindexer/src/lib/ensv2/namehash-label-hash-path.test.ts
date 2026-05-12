import {
  type InterpretedName,
  type LabelHash,
  type LiteralLabel,
  labelhashLiteralLabel,
  namehashInterpretedName,
} from "enssdk";
import { describe, expect, it } from "vitest";

import { namehashLabelHashPath } from "./namehash-label-hash-path";

const labelHashOf = (label: string) => labelhashLiteralLabel(label as LiteralLabel);

describe("namehashLabelHashPath", () => {
  it("namehashes a single labelHash to the same node as namehashing the label", () => {
    // Known label whose hash is its own namehash-input element
    const eth = labelHashOf("eth");
    expect(namehashLabelHashPath([eth])).toBe(namehashInterpretedName("eth" as InterpretedName));
  });

  it("namehashes a leaf-first path equivalent to dot-joining the labels", () => {
    // Path is leaf-first: ["wallet", "sub1", "sub2", "parent", "eth"]
    const labels = ["wallet", "sub1", "sub2", "parent", "eth"];
    const path = labels.map(labelHashOf);

    expect(namehashLabelHashPath(path)).toBe(
      namehashInterpretedName("wallet.sub1.sub2.parent.eth" as InterpretedName),
    );
  });

  it("falls back to encoded label form for unknown labelHashes (heal-stable)", () => {
    // A labelHash with no preimage — should namehash via the encoded form `[<hash>]`
    const unknown =
      "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef" as LabelHash;
    const eth = labelHashOf("eth");

    expect(namehashLabelHashPath([unknown, eth])).toBe(
      namehashInterpretedName(`[${unknown.slice(2)}].eth` as InterpretedName),
    );
  });
});
