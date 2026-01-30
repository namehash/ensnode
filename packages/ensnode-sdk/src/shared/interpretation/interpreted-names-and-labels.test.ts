import { describe, expect, it } from "vitest";

import {
  encodeLabelHash,
  type InterpretedLabel,
  type InterpretedName,
  type LiteralLabel,
  type Name,
} from "../../ens";
import { labelhashLiteralLabel } from "../labelhash";
import {
  constructSubInterpretedName,
  interpretedLabelsToInterpretedName,
  literalLabelsToInterpretedName,
  literalLabelToInterpretedLabel,
  parsePartialInterpretedName,
} from "./interpreted-names-and-labels";

const ENCODED_LABELHASH_LABEL = /^\[[\da-f]{64}\]$/;

const NORMALIZED_LABELS = [
  "vitalik",
  "example",
  "test",
  "eth",
  "base",
  "🔥",
  "test🎂",
  "café",
  "sub",
  "a".repeat(512), // Long normalized
] as LiteralLabel[];

const UNNORMALIZED_LABELS = [
  "", // Empty string
  "Vitalik", // Uppercase
  "Example", // Uppercase
  "TEST", // Uppercase
  "ETH", // Uppercase
  "test\0", // Null character
  "vitalik\0", // Null character
  "\0", // Only null character
  "example.\0", // Null character in middle
  "test[", // Not normalizable bracket
  "test]", // Not normalizable bracket
  "test.", // Contains dot
  ".eth", // Starts with dot
  "sub.example", // Contains dot
  "test\u0000", // Unicode null
  "test\uFEFF", // Zero-width no-break space
  "test\u200B", // Zero-width space
  "test\u202E", // RTL override
  "A".repeat(300), // Long non-normalized
] as LiteralLabel[];

const EXAMPLE_ENCODED_LABEL_HASH = encodeLabelHash(
  labelhashLiteralLabel("example" as LiteralLabel),
);

describe("interpretation", () => {
  describe("interpretLiteralLabel", () => {
    it("should return normalized labels unchanged", () => {
      NORMALIZED_LABELS.forEach((label) =>
        expect(literalLabelToInterpretedLabel(label)).toBe(label),
      );
    });

    it("should encode non-normalized encodable labels as labelhashes", () => {
      UNNORMALIZED_LABELS.forEach((label) =>
        expect(literalLabelToInterpretedLabel(label)).toMatch(ENCODED_LABELHASH_LABEL),
      );
    });
  });

  describe("interpretLiteralLabelsIntoInterpretedName", () => {
    it("correctly interprets labels with period", () => {
      expect(literalLabelsToInterpretedName(["a.b", "c"] as LiteralLabel[])).toEqual(
        `${encodeLabelHash(labelhashLiteralLabel("a.b" as LiteralLabel))}.c`,
      );
    });

    it("correctly interprets labels with NULL", () => {
      expect(literalLabelsToInterpretedName(["\0", "c"] as LiteralLabel[])).toEqual(
        `${encodeLabelHash(labelhashLiteralLabel("\0" as LiteralLabel))}.c`,
      );
    });

    it("correctly interprets encoded-labelhash-looking-strings", () => {
      const literalLabelThatLooksLikeALabelHash = encodeLabelHash(
        labelhashLiteralLabel("test" as LiteralLabel),
      ) as LiteralLabel;

      expect(
        literalLabelsToInterpretedName([
          literalLabelThatLooksLikeALabelHash,
          "c",
        ] as LiteralLabel[]),
      ).toEqual(`${encodeLabelHash(labelhashLiteralLabel(literalLabelThatLooksLikeALabelHash))}.c`);
    });

    it("correctly interprets an empty array of labels", () => {
      expect(literalLabelsToInterpretedName([] as LiteralLabel[])).toEqual("");
    });
  });

  describe("interpretedLabelsToInterpretedName", () => {
    it("correctly interprets an empty array of labels", () => {
      expect(interpretedLabelsToInterpretedName([] as InterpretedLabel[])).toEqual("");
    });

    it("correctly interprets a single label", () => {
      expect(interpretedLabelsToInterpretedName(["a"] as InterpretedLabel[])).toEqual("a");
    });

    it("correctly interprets a multiple labels, including encoded labelhashes", () => {
      const literalLabel = "unnormalized.label" as LiteralLabel;
      const interpretedLabelThatLooksLikeALabelHash = literalLabelToInterpretedLabel(literalLabel);

      expect(
        interpretedLabelsToInterpretedName([
          "a",
          "b",
          "c",
          interpretedLabelThatLooksLikeALabelHash,
        ] as InterpretedLabel[]),
      ).toEqual(`a.b.c.${interpretedLabelThatLooksLikeALabelHash}`);
    });
  });

  describe("parsePartialInterpretedName", () => {
    it.each([
      // empty input
      ["", [], ""],
      // partial only (no concrete labels)
      ["t", [], "t"],
      ["test", [], "test"],
      ["exam", [], "exam"],
      ["🔥", [], "🔥"],
      // concrete TLD with empty partial
      ["eth.", ["eth"], ""],
      ["base.", ["base"], ""],
      // concrete TLD with partial SLD
      ["test.eth", ["test"], "eth"],
      ["example.eth", ["example"], "eth"],
      ["demo.eth", ["demo"], "eth"],
      ["parent.eth", ["parent"], "eth"],
      ["bridge.eth", ["bridge"], "eth"],
      ["examp.eth", ["examp"], "eth"],
      // concrete SLD with empty partial
      ["sub.parent.eth.", ["sub", "parent", "eth"], ""],
      // concrete SLD with partial 3LD
      ["sub2.parent.eth", ["sub2", "parent"], "eth"],
      ["linked.parent.eth", ["linked", "parent"], "eth"],
      // deeper nesting
      ["sub1.sub2.parent.eth", ["sub1", "sub2", "parent"], "eth"],
      ["wallet.sub1.sub2.parent.eth", ["wallet", "sub1", "sub2", "parent"], "eth"],
      ["wallet.linked.parent.eth", ["wallet", "linked", "parent"], "eth"],
      // partial at various depths
      ["wal.sub1.sub2.parent.eth", ["wal", "sub1", "sub2", "parent"], "eth"],
      ["w.sub1.sub2.parent.eth", ["w", "sub1", "sub2", "parent"], "eth"],
      // with encoded labelhashes in concrete
      [`${EXAMPLE_ENCODED_LABEL_HASH}.eth`, [EXAMPLE_ENCODED_LABEL_HASH], "eth"],
      // with encoded labelhash in partial
      [
        `example.${EXAMPLE_ENCODED_LABEL_HASH.slice(0, 20)}`,
        ["example"],
        EXAMPLE_ENCODED_LABEL_HASH.slice(0, 20),
      ],
    ] as [Name, string[], string][])(
      "parsePartialInterpretedName(%j) → { concrete: %j, partial: %j }",
      (input, expectedConcrete, expectedPartial) => {
        expect(parsePartialInterpretedName(input)).toEqual({
          concrete: expectedConcrete,
          partial: expectedPartial,
        });
      },
    );

    it.each([
      "Test.eth", // uppercase in concrete
      "EXAMPLE.eth", // uppercase in concrete
      "test\0.eth", // null in concrete
      "sub.Parent.eth", // uppercase in middle
    ] as Name[])("throws for invalid concrete label: %j", (input) => {
      expect(() => parsePartialInterpretedName(input)).toThrow();
    });
  });

  describe("constructSubInterpretedName", () => {
    it.each([
      // label only (no parent)
      ["eth", undefined, "eth"],
      ["eth", "", "eth"],
      ["test", undefined, "test"],
      ["vitalik", undefined, "vitalik"],
      // label + parent
      ["test", "eth", "test.eth"],
      ["vitalik", "eth", "vitalik.eth"],
      ["sub", "parent.eth", "sub.parent.eth"],
      ["wallet", "sub.parent.eth", "wallet.sub.parent.eth"],
      // with encoded labelhash as label
      [EXAMPLE_ENCODED_LABEL_HASH, "eth", `${EXAMPLE_ENCODED_LABEL_HASH}.eth`],
      [EXAMPLE_ENCODED_LABEL_HASH, undefined, EXAMPLE_ENCODED_LABEL_HASH],
      // with encoded labelhash in parent
      ["sub", `${EXAMPLE_ENCODED_LABEL_HASH}.eth`, `sub.${EXAMPLE_ENCODED_LABEL_HASH}.eth`],
      // emoji labels
      ["🔥", "eth", "🔥.eth"],
      ["wallet", "🔥.eth", "wallet.🔥.eth"],
    ] as [InterpretedLabel, InterpretedName | undefined, InterpretedName][])(
      "constructSubInterpretedName(%j, %j) → %j",
      (label, parent, expected) => {
        expect(constructSubInterpretedName(label, parent)).toEqual(expected);
      },
    );
  });
});
