import { describe, expect, it } from "vitest";

import { asInterpretedName } from "./interpreted-names-and-labels";
import { asResolvableName, isResolvableName } from "./resolvable-name";

describe("isResolvableName", () => {
  it("accepts normal normalized names", () => {
    expect(isResolvableName(asInterpretedName("vitalik.eth"))).toBe(true);
    expect(isResolvableName(asInterpretedName("sub.parent.eth"))).toBe(true);
    expect(isResolvableName(asInterpretedName("eth"))).toBe(true);
  });

  it("accepts a multi-byte label under the byte-length cap", () => {
    expect(isResolvableName(asInterpretedName("🦊.eth"))).toBe(true);
  });

  it("rejects names containing an Encoded LabelHash segment", () => {
    const encodedLabelHash = `[${"0".repeat(64)}]`;
    expect(isResolvableName(asInterpretedName(`${encodedLabelHash}.eth`))).toBe(false);
    expect(isResolvableName(asInterpretedName(`sub.${encodedLabelHash}.eth`))).toBe(false);
  });

  it("rejects names with a label of 256+ bytes", () => {
    expect(isResolvableName(asInterpretedName(`${"a".repeat(255)}.eth`))).toBe(true);
    expect(isResolvableName(asInterpretedName(`${"a".repeat(256)}.eth`))).toBe(false);
  });
});

describe("asResolvableName", () => {
  it("returns the name when resolvable", () => {
    const name = asInterpretedName("vitalik.eth");
    expect(asResolvableName(name)).toBe(name);
  });

  it("throws when not resolvable", () => {
    expect(() => asResolvableName(asInterpretedName(`[${"0".repeat(64)}].eth`))).toThrow(
      "Not a valid ResolvableName",
    );
  });
});
