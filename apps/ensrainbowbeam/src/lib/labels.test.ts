import {
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
  hashLabel,
  isUnhealedHit,
  type LabelHit,
} from "./labels";

const literal = (s: string) => s as LiteralLabel;

describe("hashLabel", () => {
  it("computes labelhash for a normalized lowercase label", () => {
    const result = hashLabel("vitalik");
    expect(result).toEqual({
      rawLabel: "vitalik",
      labelHash: labelhashLiteralLabel(literal("vitalik")),
    });
  });

  it("does not populate normalizedLabel when raw equals normalized", () => {
    const result = hashLabel("eth");
    expect(result.normalizedLabel).toBeUndefined();
    expect(result.normalizedLabelHash).toBeUndefined();
  });

  it("populates normalizedLabel + hash when uppercase label normalizes to lowercase", () => {
    const result = hashLabel("VITALIK");
    expect(result.rawLabel).toBe("VITALIK");
    expect(result.labelHash).toBe(labelhashLiteralLabel(literal("VITALIK")));
    expect(result.normalizedLabel).toBe("vitalik");
    expect(result.normalizedLabelHash).toBe(labelhashLiteralLabel(literal("vitalik")));
    expect(result.normalizedLabelHash).not.toBe(result.labelHash);
  });

  it("tolerates unnormalizable labels (e.g. labels with periods)", () => {
    const result = hashLabel("foo.bar");
    expect(result.rawLabel).toBe("foo.bar");
    expect(result.labelHash).toBe(labelhashLiteralLabel(literal("foo.bar")));
    expect(result.normalizedLabel).toBeUndefined();
    expect(result.normalizedLabelHash).toBeUndefined();
  });

  it("tolerates the empty string (cannot normalize)", () => {
    const result = hashLabel("");
    expect(result.rawLabel).toBe("");
    expect(result.normalizedLabel).toBeUndefined();
  });

  it("hashes a unicode label", () => {
    const label = "vitalik\u00e9";
    const result = hashLabel(label);
    expect(result.labelHash).toBe(labelhashLiteralLabel(label as LiteralLabel));
  });
});

describe("collectLookupHashes", () => {
  it("returns the deduped union of raw + normalized labelhashes", () => {
    const a = hashLabel("VITALIK");
    const b = hashLabel("vitalik");
    const hashes = collectLookupHashes([a, b]);
    expect(hashes).toHaveLength(2);
    expect(new Set(hashes).size).toBe(hashes.length);
    expect(hashes).toContain(a.labelHash);
    expect(hashes).toContain(b.labelHash);
  });

  it("ignores undefined normalized hashes", () => {
    const a = hashLabel("eth");
    const hashes = collectLookupHashes([a]);
    expect(hashes).toEqual([a.labelHash]);
  });
});

describe("isUnhealedHit", () => {
  it("returns true when interpreted equals encodeLabelHash(hash)", () => {
    const hash = labelhashLiteralLabel(literal("xyz"));
    const hit: LabelHit = { hash, interpreted: encodeLabelHash(hash) as InterpretedLabel };
    expect(isUnhealedHit(hit)).toBe(true);
  });

  it("returns false when interpreted is a healed literal", () => {
    const hash = labelhashLiteralLabel(literal("vitalik"));
    const hit: LabelHit = { hash, interpreted: "vitalik" as InterpretedLabel };
    expect(isUnhealedHit(hit)).toBe(false);
  });
});

describe("classifySubmissions", () => {
  const vitalik = hashLabel("vitalik");
  const eth = hashLabel("eth");
  const upper = hashLabel("HELLO");
  const random = hashLabel("zzzdoesnotexistzzz");

  function makeHealedHit(hash: LabelHash, label: string): LabelHit {
    return { hash, interpreted: label as InterpretedLabel };
  }

  function makeUnhealedHit(hash: LabelHash): LabelHit {
    return { hash, interpreted: encodeLabelHash(hash) as InterpretedLabel };
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

  it("classifies as unknown_in_index when ANY of the label's hashes is unhealed", () => {
    // upper has both raw + normalized hashes; if normalized is unhealed but raw is healed,
    // the submission should still be unknown_in_index.
    if (upper.normalizedLabelHash === undefined) {
      throw new Error("test fixture invariant: 'HELLO' must produce a normalized variant");
    }
    const result = classifySubmissions(
      [upper],
      [makeHealedHit(upper.labelHash, upper.rawLabel), makeUnhealedHit(upper.normalizedLabelHash)],
    );
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
