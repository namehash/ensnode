import { describe, expect, it } from "vitest";

import { CurrencyIds, parseEth, parseUsdc } from "@ensnode/ensnode-sdk";

import type { ReferrerEditionMetricsUnrecognized } from "../award-models/shared/edition-metrics";
import { ReferrerEditionMetricsTypeIds } from "../award-models/shared/edition-metrics";
import type { ReferrerLeaderboardPageUnrecognized } from "../award-models/shared/leaderboard-page";
import { ReferralProgramAwardModels } from "../award-models/shared/rules";
import { ReferralProgramStatuses } from "../status";
import {
  makeReferralProgramEditionConfigSetArraySchema,
  makeReferrerEditionMetricsSchema,
  makeReferrerLeaderboardPageSchema,
} from "./zod-schemas";

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
      awardModel: ReferralProgramAwardModels.PieSplit,
      totalAwardPoolValue: parseUsdc("1000"),
      maxQualifiedReferrers: 100,
      startTime: 1000000,
      endTime: 2000000,
      subregistryId,
      rulesUrl: "https://ensawards.org/rules",
    },
  };

  const revShareLimitEdition = {
    slug: "2026-01",
    displayName: "January 2026",
    rules: {
      awardModel: ReferralProgramAwardModels.RevShareLimit,
      totalAwardPoolValue: parseUsdc("500"),
      minQualifiedRevenueContribution: parseUsdc("10"),
      qualifiedRevenueShare: 0.5,
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

  it("parses the recognized rev-share-limit edition correctly", () => {
    const result = schema.parse([pieSplitEdition, revShareLimitEdition]);
    const revShareLimit = result.find((e) => e.slug === "2026-01");

    expect(revShareLimit).toBeDefined();
    expect(revShareLimit!.rules.awardModel).toBe(ReferralProgramAwardModels.RevShareLimit);

    const rules = revShareLimit!.rules as {
      awardModel: typeof ReferralProgramAwardModels.RevShareLimit;
      totalAwardPoolValue: { amount: bigint; currency: string };
      minQualifiedRevenueContribution: { amount: bigint; currency: string };
      qualifiedRevenueShare: number;
    };
    expect(rules.totalAwardPoolValue).toBeDefined();
    expect(rules.minQualifiedRevenueContribution).toBeDefined();
    expect(typeof rules.qualifiedRevenueShare).toBe("number");
    expect(rules.qualifiedRevenueShare).toBe(0.5);
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

describe("makeReferrerLeaderboardPageSchema", () => {
  const schema = makeReferrerLeaderboardPageSchema();

  const subregistryId = {
    chainId: 1,
    address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
  };

  const emptyPageContext = {
    page: 1,
    recordsPerPage: 25,
    totalRecords: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  const pieSplitLeaderboardPage = {
    awardModel: ReferralProgramAwardModels.PieSplit,
    rules: {
      awardModel: ReferralProgramAwardModels.PieSplit,
      totalAwardPoolValue: parseUsdc("1000"),
      maxQualifiedReferrers: 100,
      startTime: 1000000,
      endTime: 2000000,
      subregistryId,
      rulesUrl: "https://ensawards.org/rules",
    },
    referrers: [],
    aggregatedMetrics: {
      grandTotalReferrals: 0,
      grandTotalIncrementalDuration: 0,
      grandTotalRevenueContribution: parseEth("0"),
      grandTotalQualifiedReferrersFinalScore: 0,
      minFinalScoreToQualify: 0,
    },
    pageContext: emptyPageContext,
    status: ReferralProgramStatuses.Scheduled,
    accurateAsOf: 500000,
  };

  const revShareLimitLeaderboardPage = {
    awardModel: ReferralProgramAwardModels.RevShareLimit,
    rules: {
      awardModel: ReferralProgramAwardModels.RevShareLimit,
      totalAwardPoolValue: parseUsdc("2000"),
      minQualifiedRevenueContribution: parseUsdc("10"),
      qualifiedRevenueShare: 0.5,
      startTime: 1000000,
      endTime: 2000000,
      subregistryId,
      rulesUrl: "https://ensawards.org/rules",
    },
    referrers: [],
    aggregatedMetrics: {
      grandTotalReferrals: 0,
      grandTotalIncrementalDuration: 0,
      grandTotalRevenueContribution: parseEth("0"),
      awardPoolRemaining: parseUsdc("2000"),
    },
    pageContext: emptyPageContext,
    status: ReferralProgramStatuses.Active,
    accurateAsOf: 1500000,
  };

  it("parses a known pie-split leaderboard page correctly", () => {
    const result = schema.parse(pieSplitLeaderboardPage);

    expect(result.awardModel).toBe(ReferralProgramAwardModels.PieSplit);
    expect(result.status).toBe(ReferralProgramStatuses.Scheduled);
    expect(result.accurateAsOf).toBe(500000);
    expect(result.pageContext.page).toBe(1);
  });

  it("parses a known rev-share-limit leaderboard page correctly", () => {
    const result = schema.parse(revShareLimitLeaderboardPage);

    expect(result.awardModel).toBe(ReferralProgramAwardModels.RevShareLimit);
    expect(result.status).toBe(ReferralProgramStatuses.Active);
    expect(result.accurateAsOf).toBe(1500000);
  });

  it("wraps an unknown awardModel as ReferrerLeaderboardPageUnrecognized", () => {
    const input = {
      awardModel: "future-model",
      pageContext: emptyPageContext,
      status: ReferralProgramStatuses.Active,
      accurateAsOf: 1000000,
      someNewField: "extra-data",
    };

    const result = schema.parse(input);

    expect(result.awardModel).toBe(ReferralProgramAwardModels.Unrecognized);
    expect((result as ReferrerLeaderboardPageUnrecognized).originalAwardModel).toBe("future-model");
    expect(result.status).toBe(ReferralProgramStatuses.Active);
    expect(result.accurateAsOf).toBe(1000000);
    expect(result.pageContext.page).toBe(1);
  });

  it("fails when a known awardModel has invalid fields", () => {
    const invalid = {
      ...pieSplitLeaderboardPage,
      rules: {
        ...pieSplitLeaderboardPage.rules,
        totalAwardPoolValue: { amount: "not-a-number", currency: CurrencyIds.USDC },
      },
    };

    expect(() => schema.parse(invalid)).toThrow();
  });

  it("fails when an unknown awardModel is missing required base fields", () => {
    const input = {
      awardModel: "future-model",
      // pageContext missing, status missing, accurateAsOf missing
    };

    expect(() => schema.parse(input)).toThrow();
  });
});

describe("makeReferrerEditionMetricsSchema", () => {
  const schema = makeReferrerEditionMetricsSchema();

  const subregistryId = {
    chainId: 1,
    address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
  };

  const pieSplitRules = {
    awardModel: ReferralProgramAwardModels.PieSplit,
    totalAwardPoolValue: parseUsdc("1000"),
    maxQualifiedReferrers: 100,
    startTime: 1000000,
    endTime: 2000000,
    subregistryId,
    rulesUrl: "https://ensawards.org/rules",
  };

  const pieSplitAggregatedMetrics = {
    grandTotalReferrals: 5,
    grandTotalIncrementalDuration: 100,
    grandTotalRevenueContribution: parseEth("500"),
    grandTotalQualifiedReferrersFinalScore: 1.65,
    minFinalScoreToQualify: 0,
  };

  it("parses a known pie-split ranked edition metrics correctly", () => {
    const input = {
      awardModel: ReferralProgramAwardModels.PieSplit,
      type: ReferrerEditionMetricsTypeIds.Ranked,
      rules: pieSplitRules,
      referrer: {
        referrer: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        totalReferrals: 5,
        totalIncrementalDuration: 100,
        totalRevenueContribution: parseEth("500"),
        score: 1.5,
        rank: 1,
        isQualified: true,
        finalScoreBoost: 0.1,
        finalScore: 1.65,
        awardPoolShare: 0.5,
        awardPoolApproxValue: parseUsdc("500"),
      },
      aggregatedMetrics: pieSplitAggregatedMetrics,
      status: ReferralProgramStatuses.Active,
      accurateAsOf: 1500000,
    };

    const result = schema.parse(input);

    expect(result.awardModel).toBe(ReferralProgramAwardModels.PieSplit);
    if (result.awardModel !== ReferralProgramAwardModels.PieSplit) throw new Error();
    expect(result.type).toBe(ReferrerEditionMetricsTypeIds.Ranked);
  });

  it("parses a known pie-split unranked edition metrics correctly", () => {
    const input = {
      awardModel: ReferralProgramAwardModels.PieSplit,
      type: ReferrerEditionMetricsTypeIds.Unranked,
      rules: pieSplitRules,
      referrer: {
        referrer: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        totalReferrals: 0,
        totalIncrementalDuration: 0,
        totalRevenueContribution: parseEth("0"),
        score: 0,
        rank: null,
        isQualified: false,
        finalScoreBoost: 0,
        finalScore: 0,
        awardPoolShare: 0,
        awardPoolApproxValue: parseUsdc("0"),
      },
      aggregatedMetrics: pieSplitAggregatedMetrics,
      status: ReferralProgramStatuses.Active,
      accurateAsOf: 1500000,
    };

    const result = schema.parse(input);

    expect(result.awardModel).toBe(ReferralProgramAwardModels.PieSplit);
    if (result.awardModel !== ReferralProgramAwardModels.PieSplit) throw new Error();
    expect(result.type).toBe(ReferrerEditionMetricsTypeIds.Unranked);
  });

  it("parses a known rev-share-limit ranked edition metrics correctly", () => {
    const input = {
      awardModel: ReferralProgramAwardModels.RevShareLimit,
      type: ReferrerEditionMetricsTypeIds.Ranked,
      rules: {
        awardModel: ReferralProgramAwardModels.RevShareLimit,
        totalAwardPoolValue: parseUsdc("2000"),
        minQualifiedRevenueContribution: parseUsdc("10"),
        qualifiedRevenueShare: 0.5,
        startTime: 1000000,
        endTime: 2000000,
        subregistryId,
        rulesUrl: "https://ensawards.org/rules",
      },
      referrer: {
        referrer: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        totalReferrals: 3,
        totalIncrementalDuration: 60,
        totalRevenueContribution: parseEth("300"),
        totalBaseRevenueContribution: parseUsdc("150"),
        rank: 1,
        isQualified: true,
        standardAwardValue: parseUsdc("200"),
        awardPoolApproxValue: parseUsdc("200"),
        isAdminDisqualified: false,
        adminDisqualificationReason: null,
      },
      aggregatedMetrics: {
        grandTotalReferrals: 3,
        grandTotalIncrementalDuration: 60,
        grandTotalRevenueContribution: parseEth("300"),
        awardPoolRemaining: parseUsdc("1800"),
      },
      status: ReferralProgramStatuses.Active,
      accurateAsOf: 1500000,
    };

    const result = schema.parse(input);

    expect(result.awardModel).toBe(ReferralProgramAwardModels.RevShareLimit);
    if (result.awardModel !== ReferralProgramAwardModels.RevShareLimit) throw new Error();
    expect(result.type).toBe(ReferrerEditionMetricsTypeIds.Ranked);
  });

  it("fails when a known awardModel has invalid fields", () => {
    const invalid = {
      awardModel: ReferralProgramAwardModels.PieSplit,
      type: ReferrerEditionMetricsTypeIds.Ranked,
      rules: {
        ...pieSplitRules,
        endTime: 500000, // endTime < startTime → refine violation
      },
      referrer: {
        referrer: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        totalReferrals: 5,
        totalIncrementalDuration: 100,
        totalRevenueContribution: parseEth("500"),
        score: 1.5,
        rank: 1,
        isQualified: true,
        finalScoreBoost: 0.1,
        finalScore: 1.65,
        awardPoolShare: 0.5,
        awardPoolApproxValue: parseUsdc("500"),
      },
      aggregatedMetrics: pieSplitAggregatedMetrics,
      status: ReferralProgramStatuses.Active,
      accurateAsOf: 1500000,
    };

    expect(() => schema.parse(invalid)).toThrow();
  });

  it("wraps an unknown awardModel as ReferrerEditionMetricsUnrecognized", () => {
    const input = {
      awardModel: "future-model",
      someNewField: "extra-data",
    };

    const result = schema.parse(input);

    expect(result.awardModel).toBe(ReferralProgramAwardModels.Unrecognized);
    expect((result as ReferrerEditionMetricsUnrecognized).originalAwardModel).toBe("future-model");
  });
});
