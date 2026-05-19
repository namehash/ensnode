import { describe, expect, it } from "vitest";

import { parseUsdc } from "@ensnode/ensnode-sdk";

import { ReferralProgramAwardModels } from "./award-models/shared/rules";
import {
  buildReferralProgramEditionConfigSet,
  findOverlappingEditionPair,
  type ReferralProgramEditionConfig,
} from "./edition";

const subregistry = {
  chainId: 1,
  address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85" as const,
};

const makePieSplitEdition = (
  slug: string,
  startTime: number,
  endTime: number,
  subregistryId = subregistry,
): ReferralProgramEditionConfig => ({
  slug,
  displayName: slug,
  rules: {
    awardModel: ReferralProgramAwardModels.PieSplit,
    awardPool: parseUsdc("1000"),
    maxQualifiedReferrers: 100,
    startTime,
    endTime,
    subregistryId,
    rulesUrl: new URL("https://ensawards.org/rules"),
    areAwardsDistributed: false,
  },
});

describe("findOverlappingEditionPair", () => {
  it("returns null when editions are disjoint for the same subregistry", () => {
    const a = makePieSplitEdition("a", 1000, 1999);
    const b = makePieSplitEdition("b", 2000, 3000);

    expect(findOverlappingEditionPair([a, b])).toBeNull();
  });

  it("returns the overlapping pair when ranges interior-overlap", () => {
    const a = makePieSplitEdition("a", 1000, 2500);
    const b = makePieSplitEdition("b", 2000, 3000);

    const result = findOverlappingEditionPair([a, b]);
    expect(result).not.toBeNull();
    expect(result![0].slug).toBe("a");
    expect(result![1].slug).toBe("b");
  });

  it("treats touching edges as overlap (bounds are inclusive)", () => {
    const a = makePieSplitEdition("a", 1000, 2000);
    const b = makePieSplitEdition("b", 2000, 3000);

    expect(findOverlappingEditionPair([a, b])).not.toBeNull();
  });

  it("returns null when time ranges overlap but subregistries differ", () => {
    const a = makePieSplitEdition("a", 1000, 2000, { ...subregistry, chainId: 1 });
    const b = makePieSplitEdition("b", 1000, 2000, { ...subregistry, chainId: 8453 });

    expect(findOverlappingEditionPair([a, b])).toBeNull();
  });
});

describe("buildReferralProgramEditionConfigSet — overlap invariant", () => {
  it("builds a set from non-overlapping editions", () => {
    const a = makePieSplitEdition("a", 1000, 1999);
    const b = makePieSplitEdition("b", 2000, 3000);

    const set = buildReferralProgramEditionConfigSet([a, b]);
    expect(set.size).toBe(2);
  });

  it("throws when editions overlap", () => {
    const a = makePieSplitEdition("a", 1000, 2000);
    const b = makePieSplitEdition("b", 1500, 2500);

    expect(() => buildReferralProgramEditionConfigSet([a, b])).toThrow(/overlapping time ranges/i);
  });

  it("throws when two editions share a subregistry and have touching edges", () => {
    const a = makePieSplitEdition("a", 1000, 2000);
    const b = makePieSplitEdition("b", 2000, 3000);

    expect(() => buildReferralProgramEditionConfigSet([a, b])).toThrow(/overlapping time ranges/i);
  });

  it("builds a set when overlapping editions target different subregistries", () => {
    const a = makePieSplitEdition("a", 1000, 2000, { ...subregistry, chainId: 1 });
    const b = makePieSplitEdition("b", 1000, 2000, { ...subregistry, chainId: 8453 });

    const set = buildReferralProgramEditionConfigSet([a, b]);
    expect(set.size).toBe(2);
  });
});
