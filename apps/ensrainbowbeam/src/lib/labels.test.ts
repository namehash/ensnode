import {
  asLiteralLabel,
  encodeLabelHash,
  type InterpretedLabel,
  type LabelHash,
  type LiteralLabel,
  labelhashLiteralLabel,
} from "enssdk";
import { describe, expect, it } from "vitest";

import {
  classifySubmissions,
  collectLookupHashes,
  isUnhealedHit,
  type LabelHit,
  labelhashNormalizedLabel,
} from "./labels";

const literal = (s: string) => s as LiteralLabel;

describe("hashNormalizedLabel", () => {
  it("hashes the normalized form of a lowercase label", () => {
    const result = labelhashNormalizedLabel(literal("vitalik"));
    expect(result).toEqual({
      rawLabel: literal("vitalik"),
      labelHash: labelhashLiteralLabel(literal("vitalik")),
    });
  });

  it("does not populate normalizedLabel when raw equals normalized", () => {
    const result = labelhashNormalizedLabel(literal("eth"));
    expect(result?.normalizedLabel).toBeUndefined();
    expect(result?.labelHash).toBe(labelhashLiteralLabel(literal("eth")));
  });

  it("normalizes and hashes uppercase labels (no raw hash)", () => {
    const result = labelhashNormalizedLabel(literal("VITALIK"));
    expect(result).toEqual({
      rawLabel: literal("VITALIK"),
      normalizedLabel: literal("vitalik"),
      labelHash: labelhashLiteralLabel(literal("vitalik")),
    });
    expect(result?.labelHash).not.toBe(labelhashLiteralLabel(literal("VITALIK")));
  });

  it("returns null for unnormalizable labels (e.g. labels with periods)", () => {
    expect(labelhashNormalizedLabel(literal("foo.bar"))).toBeNull();
  });

  it("returns null for the empty string", () => {
    expect(labelhashNormalizedLabel(asLiteralLabel(""))).toBeNull();
  });

  it("hashes the normalized unicode label", () => {
    const label = "vitalik\u00e9";
    const result = labelhashNormalizedLabel(asLiteralLabel(label));
    expect(result?.labelHash).toBe(labelhashLiteralLabel(asLiteralLabel(label)));
  });
});

describe("collectLookupHashes", () => {
  it("returns the deduped normalized labelhashes", () => {
    const a = labelhashNormalizedLabel(literal("VITALIK"));
    const b = labelhashNormalizedLabel(literal("vitalik"));
    if (a === null || b === null) throw new Error("test fixture invariant");
    const hashes = collectLookupHashes([a, b]);
    expect(hashes).toEqual([a.labelHash]);
  });

  it("returns one hash per distinct normalized label", () => {
    const a = labelhashNormalizedLabel(literal("eth"));
    if (a === null) throw new Error("test fixture invariant");
    expect(collectLookupHashes([a])).toEqual([a.labelHash]);
  });
});

describe("isUnhealedHit", () => {
  it("returns true when interpreted equals encodeLabelHash(hash)", () => {
    const hash = labelhashLiteralLabel(literal("xyz"));
    const hit: LabelHit = {
      labelhash: hash,
      interpreted: encodeLabelHash(hash) as InterpretedLabel,
    };
    expect(isUnhealedHit(hit)).toBe(true);
  });

  it("returns false when interpreted is a healed literal", () => {
    const hash = labelhashLiteralLabel(literal("vitalik"));
    const hit: LabelHit = { labelhash: hash, interpreted: "vitalik" as InterpretedLabel };
    expect(isUnhealedHit(hit)).toBe(false);
  });
});

describe("classifySubmissions", () => {
  const vitalik = labelhashNormalizedLabel(literal("vitalik"));
  const eth = labelhashNormalizedLabel(literal("eth"));
  const random = labelhashNormalizedLabel(literal("zzzdoesnotexistzzz"));
  if (vitalik === null || eth === null || random === null) {
    throw new Error("test fixture invariant");
  }

  function makeHealedHit(labelhash: LabelHash, label: string): LabelHit {
    return { labelhash, interpreted: label as InterpretedLabel };
  }

  function makeUnhealedHit(labelhash: LabelHash): LabelHit {
    return { labelhash, interpreted: encodeLabelHash(labelhash) as InterpretedLabel };
  }

  it("classifies absent labels as absent_from_index", () => {
    const result = classifySubmissions([random], []);
    expect(result).toEqual([{ ...random, status: "absent_from_index" }]);
  });

  it("classifies a healed-only hit as healed_in_index", () => {
    const result = classifySubmissions([vitalik], [makeHealedHit(vitalik.labelHash, "vitalik")]);
    expect(result[0].status).toBe("healed_in_index");
  });

  it("classifies an unhealed hit as unknown_in_index", () => {
    const result = classifySubmissions([vitalik], [makeUnhealedHit(vitalik.labelHash)]);
    expect(result[0].status).toBe("unknown_in_index");
  });

  it("classifies uppercase submissions against the normalized hash only", () => {
    const upper = labelhashNormalizedLabel(literal("HELLO"));
    if (upper === null) throw new Error("test fixture invariant");
    const result = classifySubmissions([upper], [makeUnhealedHit(upper.labelHash)]);
    expect(result[0].status).toBe("unknown_in_index");
  });

  it("handles a mixed batch", () => {
    const result = classifySubmissions(
      [vitalik, eth, random],
      [
        makeUnhealedHit(vitalik.labelHash),
        makeHealedHit(eth.labelHash, "eth"),
        // random has no hit
      ],
    );

    expect(result.map((r) => r.status)).toEqual([
      "unknown_in_index",
      "healed_in_index",
      "absent_from_index",
    ]);
  });
});
