import { describe, expect, it } from "vitest";

import { ReferralProgramAwardModels } from "../award-models/shared/rules";
import { makeReferralProgramEditionConfigSetArraySchema } from "./zod-schemas";

describe("makeReferralProgramEditionConfigSetArraySchema", () => {
  const schema = makeReferralProgramEditionConfigSetArraySchema();

  const subregistryId = {
    chainId: 1,
    address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
  };

  const pieSplitEdition = {
    slug: "2025-12",
    displayName: "December 2025",
    rules: {
      awardModel: "pie-split",
      totalAwardPoolValue: { amount: "1000", currency: "USDC" },
      maxQualifiedReferrers: 100,
      startTime: 1000000,
      endTime: 2000000,
      subregistryId,
      rulesUrl: "https://ensawards.org/rules",
    },
  };

  const futureModelEdition = {
    slug: "2026-03",
    displayName: "March 2026",
    rules: {
      awardModel: "future-model",
      startTime: 2000000,
      endTime: 3000000,
      subregistryId,
      rulesUrl: "https://ensawards.org/rules",
      someNewField: "extra-data",
    },
  };

  it("preserves both a recognized and an unrecognized edition", () => {
    const result = schema.parse([pieSplitEdition, futureModelEdition]);

    expect(result).toHaveLength(2);
  });

  it("parses the recognized pie-split edition correctly", () => {
    const result = schema.parse([pieSplitEdition, futureModelEdition]);
    const pieSplit = result.find((e) => e.slug === "2025-12");

    expect(pieSplit).toBeDefined();
    expect(pieSplit!.rules.awardModel).toBe(ReferralProgramAwardModels.PieSplit);
  });

  it("wraps the unrecognized edition as ReferralProgramRulesUnrecognized", () => {
    const result = schema.parse([pieSplitEdition, futureModelEdition]);
    const unrecognized = result.find((e) => e.slug === "2026-03");

    expect(unrecognized).toBeDefined();
    expect(unrecognized!.rules.awardModel).toBe(ReferralProgramAwardModels.Unrecognized);
    expect((unrecognized!.rules as { originalAwardModel: string }).originalAwardModel).toBe(
      "future-model",
    );
  });

  it("copies base fields onto the unrecognized edition", () => {
    const result = schema.parse([pieSplitEdition, futureModelEdition]);
    const unrecognized = result.find((e) => e.slug === "2026-03");

    expect(unrecognized!.rules.startTime).toBe(2000000);
    expect(unrecognized!.rules.endTime).toBe(3000000);
    expect(unrecognized!.rules.rulesUrl).toBeInstanceOf(URL);
    expect(unrecognized!.rules.rulesUrl.href).toBe("https://ensawards.org/rules");
  });

  it("fails when an unrecognized edition has malformed base fields", () => {
    const malformedUnrecognized = {
      slug: "2026-03",
      displayName: "March 2026",
      rules: {
        awardModel: "future-model",
        // startTime missing, endTime missing
        subregistryId,
        rulesUrl: "https://ensawards.org/rules",
      },
    };

    expect(() => schema.parse([pieSplitEdition, malformedUnrecognized])).toThrow();
  });

  it("fails when the result list would be empty", () => {
    const malformedUnrecognized = {
      slug: "2026-03",
      displayName: "March 2026",
      rules: {
        awardModel: "future-model",
        // no valid base fields
      },
    };

    expect(() => schema.parse([malformedUnrecognized])).toThrow();
  });

  it("fails when duplicate slugs exist across recognized and unrecognized editions", () => {
    const duplicateUnrecognized = {
      ...futureModelEdition,
      slug: "2025-12", // same slug as pie-split edition
    };

    expect(() => schema.parse([pieSplitEdition, duplicateUnrecognized])).toThrow();
  });
});
