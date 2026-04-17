import { describe, expect, it } from "vitest";

import { ENS_ROOT_NAME } from "./constants";
import {
  asInterpretedLabel,
  asLiteralLabel,
  asLiteralName,
  constructSubInterpretedName,
  interpretedLabelsToInterpretedName,
  literalLabelsToInterpretedName,
  literalLabelToInterpretedLabel,
  literalNameToInterpretedName,
  parsePartialInterpretedName,
} from "./interpreted-names-and-labels";
import { encodeLabelHash, labelhashLiteralLabel } from "./labelhash";
import type { InterpretedLabel, InterpretedName, LiteralLabel, Name } from "./types";

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
].map(asLiteralLabel);

const UNNORMALIZED_LABELS = [
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
].map(asLiteralLabel);

const EXAMPLE_ENCODED_LABEL_HASH = encodeLabelHash(
  labelhashLiteralLabel(asLiteralLabel("example")),
);

describe("interpretation", () => {
  describe("literalLabelToInterpretedLabel", () => {
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

  describe("literalLabelsToInterpretedName", () => {
    it("correctly interprets labels with period", () => {
      expect(literalLabelsToInterpretedName(["a.b", "c"].map(asLiteralLabel))).toEqual(
        `${encodeLabelHash(labelhashLiteralLabel(asLiteralLabel("a.b")))}.c`,
      );
    });

    it("correctly interprets labels with NULL", () => {
      expect(literalLabelsToInterpretedName(["\0", "c"].map(asLiteralLabel))).toEqual(
        `${encodeLabelHash(labelhashLiteralLabel(asLiteralLabel("\0")))}.c`,
      );
    });

    it("correctly interprets encoded-labelhash-looking-strings", () => {
      const literalLabelThatLooksLikeALabelHash = asLiteralLabel(
        encodeLabelHash(labelhashLiteralLabel(asLiteralLabel("test"))),
      );

      expect(
        literalLabelsToInterpretedName([literalLabelThatLooksLikeALabelHash, asLiteralLabel("c")]),
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
      expect(interpretedLabelsToInterpretedName(["a"].map(asInterpretedLabel))).toEqual("a");
    });

    it("correctly interprets a multiple labels, including encoded labelhashes", () => {
      const literalLabel = asLiteralLabel("unnormalized.label");
      const interpretedLabelThatLooksLikeALabelHash = literalLabelToInterpretedLabel(literalLabel);

      expect(
        interpretedLabelsToInterpretedName(
          ["a", "b", "c", interpretedLabelThatLooksLikeALabelHash].map(asInterpretedLabel),
        ),
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

  describe("literalNameToInterpretedName", () => {
    type Options = Parameters<typeof literalNameToInterpretedName>[1];

    const ENCODED_TEST_NULL = encodeLabelHash(labelhashLiteralLabel(asLiteralLabel("test\0")));
    const ENCODED_BAD_BRACKET = encodeLabelHash(labelhashLiteralLabel(asLiteralLabel("bad[")));
    const ENCODED_HASH_AS_LITERAL = encodeLabelHash(
      labelhashLiteralLabel(asLiteralLabel(EXAMPLE_ENCODED_LABEL_HASH)),
    );
    const ALL_OPTIONS = {
      allowENSRootName: true,
      allowEncodedLabelHashes: true,
      coerceUnnormalizedLabelsToNormalizedLabels: true,
      coerceUnnormalizableLabelsToEncodedLabelHashes: true,
    } as const satisfies Options;

    it.each<[string, Options, string]>([
      // defaults: fully-normalized names pass through
      ["eth", undefined, "eth"],
      ["vitalik.eth", undefined, "vitalik.eth"],
      ["sub.vitalik.eth", undefined, "sub.vitalik.eth"],
      // defaults: ENSIP-15 normalizes normalizable-but-not-normalized Labels
      ["Vitalik.eth", undefined, "vitalik.eth"],
      ["VITALIK.ETH", undefined, "vitalik.eth"],
      ["Sub.Vitalik.Eth", undefined, "sub.vitalik.eth"],
      // coerceUnnormalizable=false is irrelevant when no unnormalizable Labels are present
      ["Vitalik.eth", { coerceUnnormalizableLabelsToEncodedLabelHashes: false }, "vitalik.eth"],
      // coerceUnnormalized=true (explicit): normalizable-but-not-normalized Labels are normalized
      ["Vitalik.eth", { coerceUnnormalizedLabelsToNormalizedLabels: true }, "vitalik.eth"],
      // coerceUnnormalized=false: fully-normalized names still pass through unchanged
      ["vitalik.eth", { coerceUnnormalizedLabelsToNormalizedLabels: false }, "vitalik.eth"],
      ["sub.vitalik.eth", { coerceUnnormalizedLabelsToNormalizedLabels: false }, "sub.vitalik.eth"],
      // coerceUnnormalized=false + allowEncodedLabelHashes=true: pre-encoded labelhashes still preserved
      [
        `${EXAMPLE_ENCODED_LABEL_HASH}.eth`,
        {
          coerceUnnormalizedLabelsToNormalizedLabels: false,
          allowEncodedLabelHashes: true,
        },
        `${EXAMPLE_ENCODED_LABEL_HASH}.eth`,
      ],
      // allowENSRootName=true: empty input returns ENS Root Name
      [ENS_ROOT_NAME, { allowENSRootName: true }, ENS_ROOT_NAME],
      // allowEncodedLabelHashes=true: pre-encoded labelhashes preserved verbatim
      [
        `${EXAMPLE_ENCODED_LABEL_HASH}.eth`,
        { allowEncodedLabelHashes: true },
        `${EXAMPLE_ENCODED_LABEL_HASH}.eth`,
      ],
      [
        `sub.${EXAMPLE_ENCODED_LABEL_HASH}.eth`,
        { allowEncodedLabelHashes: true },
        `sub.${EXAMPLE_ENCODED_LABEL_HASH}.eth`,
      ],
      // allowEncodedLabelHashes=true: still normalizes other labels in the name
      [
        `Sub.${EXAMPLE_ENCODED_LABEL_HASH}.Eth`,
        { allowEncodedLabelHashes: true },
        `sub.${EXAMPLE_ENCODED_LABEL_HASH}.eth`,
      ],
      // encodeUnnormalizable=true: unnormalizable Labels are encoded as the labelhash of their literal bytes
      [
        "test\0.eth",
        { coerceUnnormalizableLabelsToEncodedLabelHashes: true },
        `${ENCODED_TEST_NULL}.eth`,
      ],
      // encodeUnnormalizable=true: multiple unnormalizable Labels encoded independently
      [
        "test\0.bad[.eth",
        { coerceUnnormalizableLabelsToEncodedLabelHashes: true },
        `${ENCODED_TEST_NULL}.${ENCODED_BAD_BRACKET}.eth`,
      ],
      // allowEncodedLabelHashes=false + encodeUnnormalizable=true: a "[hash]" Label
      // fails normalization and is encoded as the labelhash of the literal bracket
      // string, NOT the original labelhash it encoded.
      [
        `${EXAMPLE_ENCODED_LABEL_HASH}.eth`,
        {
          allowEncodedLabelHashes: false,
          coerceUnnormalizableLabelsToEncodedLabelHashes: true,
        },
        `${ENCODED_HASH_AS_LITERAL}.eth`,
      ],
      // all options enabled: ENS Root Name
      [ENS_ROOT_NAME, ALL_OPTIONS, ENS_ROOT_NAME],
      // all options enabled: encoded labelhash preserved, other labels normalized
      [
        `Sub.${EXAMPLE_ENCODED_LABEL_HASH}.eth`,
        ALL_OPTIONS,
        `sub.${EXAMPLE_ENCODED_LABEL_HASH}.eth`,
      ],
      // all options enabled: unnormalizable Label encoded alongside preserved encoded labelhash
      [
        `test\0.${EXAMPLE_ENCODED_LABEL_HASH}.eth`,
        ALL_OPTIONS,
        `${ENCODED_TEST_NULL}.${EXAMPLE_ENCODED_LABEL_HASH}.eth`,
      ],
    ])("literalNameToInterpretedName(%j, %j) → %j", (name, options, expected) => {
      expect(literalNameToInterpretedName(asLiteralName(name), options)).toEqual(expected);
    });

    it.each<[string, Options, RegExp]>([
      // empty input rejected when allowENSRootName is false
      [ENS_ROOT_NAME, undefined, /ENS Root Name/],
      [ENS_ROOT_NAME, { allowENSRootName: false }, /ENS Root Name/],
      // empty Label segments always rejected, regardless of options
      ["example..eth", undefined, /empty Label segment/],
      [".eth", undefined, /empty Label segment/],
      ["eth.", undefined, /empty Label segment/],
      ["example..eth", { allowENSRootName: true }, /empty Label segment/],
      ["a..b", ALL_OPTIONS, /empty Label segment/],
      // unnormalizable Label rejected when encodeUnnormalizable is false
      ["test\0.eth", undefined, /cannot be normalized/],
      [
        "test\0.eth",
        { coerceUnnormalizableLabelsToEncodedLabelHashes: false },
        /cannot be normalized/,
      ],
      // pre-encoded labelhash rejected when allowEncodedLabelHashes is false (falls
      // through to the unnormalizable handler, which also throws under defaults)
      [`${EXAMPLE_ENCODED_LABEL_HASH}.eth`, undefined, /cannot be normalized/],
      [
        `${EXAMPLE_ENCODED_LABEL_HASH}.eth`,
        { allowEncodedLabelHashes: false },
        /cannot be normalized/,
      ],
      // strings that merely look like encoded labelhashes (wrong length) are still
      // treated as unnormalizable literals, even when allowEncodedLabelHashes=true
      ["[deadbeef].eth", { allowEncodedLabelHashes: true }, /cannot be normalized/],
      // coerceUnnormalized=false: a normalizable-but-not-normalized Label is rejected
      // up-front without attempting normalization
      [
        "Vitalik.eth",
        { coerceUnnormalizedLabelsToNormalizedLabels: false },
        /coercion is disabled/,
      ],
      // coerceUnnormalized=false: an unnormalizable Label is rejected with the same
      // "coercion is disabled" message (no normalization is attempted)
      ["test\0.eth", { coerceUnnormalizedLabelsToNormalizedLabels: false }, /coercion is disabled/],
      // coerceUnnormalized=false gates coerceUnnormalizable=true: even an unnormalizable
      // Label that would otherwise be encoded is rejected
      [
        "test\0.eth",
        {
          coerceUnnormalizedLabelsToNormalizedLabels: false,
          coerceUnnormalizableLabelsToEncodedLabelHashes: true,
        },
        /coercion is disabled/,
      ],
    ])("literalNameToInterpretedName(%j, %j) throws %s", (name, options, expectedError) => {
      expect(() => literalNameToInterpretedName(asLiteralName(name), options)).toThrow(
        expectedError,
      );
    });
  });
});
