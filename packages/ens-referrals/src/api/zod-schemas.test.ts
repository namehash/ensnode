import { describe, expect, it } from "vitest";

import { CurrencyIds, parseEth, parseUsdc } from "@ensnode/ensnode-sdk";

import { AdminActionTypes } from "../award-models/rev-share-cap/rules";
import type { ReferrerEditionMetricsUnrecognized } from "../award-models/shared/edition-metrics";
import { ReferrerEditionMetricsTypeIds } from "../award-models/shared/edition-metrics";
import type { ReferralProgramEditionSummaryUnrecognized } from "../award-models/shared/edition-summary";
import type { ReferrerLeaderboardPageUnrecognized } from "../award-models/shared/leaderboard-page";
import { ReferralProgramAwardModels } from "../award-models/shared/rules";
import { ReferralProgramEditionStatuses } from "../award-models/shared/status";
import {
  makeReferralProgramEditionConfigSetArraySchema,
  makeReferralProgramEditionSummarySchema,
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
      awardPool: parseUsdc("1000"),
      maxQualifiedReferrers: 100,
      startTime: 1000000,
      endTime: 2000000,
      subregistryId,
      rulesUrl: "https://ensawards.org/rules",
      areAwardsDistributed: false,
    },
  };

  const revShareCapEdition = {
    slug: "2026-01",
    displayName: "January 2026",
    rules: {
      awardModel: ReferralProgramAwardModels.RevShareCap,
      awardPool: parseUsdc("500"),
      minBaseRevenueContribution: parseUsdc("10"),
      baseAnnualRevenueContribution: parseUsdc("5"),
      maxBaseRevenueShare: 0.5,
      startTime: 1000000,
      endTime: 2000000,
      subregistryId,
      rulesUrl: "https://ensawards.org/rules",
      areAwardsDistributed: false,
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
      areAwardsDistributed: false,
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
    expect(pieSplit!.rules.areAwardsDistributed).toBe(pieSplitEdition.rules.areAwardsDistributed);
  });

  it("parses the recognized rev-share-cap edition correctly", () => {
    const result = schema.parse([pieSplitEdition, revShareCapEdition]);
    const revShareCap = result.find((e) => e.slug === "2026-01");

    expect(revShareCap).toBeDefined();
    expect(revShareCap!.rules.awardModel).toBe(ReferralProgramAwardModels.RevShareCap);

    const rules = revShareCap!.rules as {
      awardModel: typeof ReferralProgramAwardModels.RevShareCap;
      awardPool: { amount: bigint; currency: string };
      minBaseRevenueContribution: { amount: bigint; currency: string };
      baseAnnualRevenueContribution: { amount: bigint; currency: string };
      maxBaseRevenueShare: number;
    };
    expect(rules.awardPool).toBeDefined();
    expect(rules.minBaseRevenueContribution).toBeDefined();
    expect(rules.baseAnnualRevenueContribution).toBeDefined();
    expect(typeof rules.maxBaseRevenueShare).toBe("number");
    expect(rules.maxBaseRevenueShare).toBe(0.5);
    expect(revShareCap!.rules.areAwardsDistributed).toBe(
      revShareCapEdition.rules.areAwardsDistributed,
    );
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
    expect(unrecognized!.rules.areAwardsDistributed).toBe(
      futureModelEdition.rules.areAwardsDistributed,
    );
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
        areAwardsDistributed: false,
      },
    };

    expect(() => schema.parse([pieSplitEdition, malformedUnrecognized])).toThrow();
  });

  it("accepts an empty array", () => {
    const result = schema.parse([]);

    expect(result).toEqual([]);
  });

  it("fails when an unrecognized edition has entirely missing base fields", () => {
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
      awardPool: parseUsdc("1000"),
      maxQualifiedReferrers: 100,
      startTime: 1000000,
      endTime: 2000000,
      subregistryId,
      rulesUrl: "https://ensawards.org/rules",
      areAwardsDistributed: false,
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
    status: ReferralProgramEditionStatuses.Scheduled,
    accurateAsOf: 500000,
  };

  const revShareCapLeaderboardPage = {
    awardModel: ReferralProgramAwardModels.RevShareCap,
    rules: {
      awardModel: ReferralProgramAwardModels.RevShareCap,
      awardPool: parseUsdc("2000"),
      minBaseRevenueContribution: parseUsdc("10"),
      baseAnnualRevenueContribution: parseUsdc("5"),
      maxBaseRevenueShare: 0.5,
      startTime: 1000000,
      endTime: 2000000,
      subregistryId,
      rulesUrl: "https://ensawards.org/rules",
      areAwardsDistributed: false,
    },
    referrers: [],
    aggregatedMetrics: {
      grandTotalReferrals: 0,
      grandTotalIncrementalDuration: 0,
      grandTotalRevenueContribution: parseEth("0"),
      awardPoolRemaining: parseUsdc("2000"),
    },
    pageContext: emptyPageContext,
    status: ReferralProgramEditionStatuses.Active,
    accurateAsOf: 1500000,
  };

  it("parses a known pie-split leaderboard page correctly", () => {
    const result = schema.parse(pieSplitLeaderboardPage);

    expect(result.awardModel).toBe(ReferralProgramAwardModels.PieSplit);
    expect(result.status).toBe(ReferralProgramEditionStatuses.Scheduled);
    expect(result.accurateAsOf).toBe(500000);
    expect(result.pageContext.page).toBe(1);
  });

  it("parses a known rev-share-cap leaderboard page correctly", () => {
    const result = schema.parse(revShareCapLeaderboardPage);

    expect(result.awardModel).toBe(ReferralProgramAwardModels.RevShareCap);
    expect(result.status).toBe(ReferralProgramEditionStatuses.Active);
    expect(result.accurateAsOf).toBe(1500000);
  });

  it("wraps an unknown awardModel as ReferrerLeaderboardPageUnrecognized", () => {
    const input = {
      awardModel: "future-model",
      pageContext: emptyPageContext,
      status: ReferralProgramEditionStatuses.Active,
      accurateAsOf: 1000000,
      someNewField: "extra-data",
    };

    const result = schema.parse(input);

    expect(result.awardModel).toBe(ReferralProgramAwardModels.Unrecognized);
    expect((result as ReferrerLeaderboardPageUnrecognized).originalAwardModel).toBe("future-model");
    expect(result.status).toBe(ReferralProgramEditionStatuses.Active);
    expect(result.accurateAsOf).toBe(1000000);
    expect(result.pageContext.page).toBe(1);
  });

  it("fails when a known awardModel has invalid fields", () => {
    const invalid = {
      ...pieSplitLeaderboardPage,
      rules: {
        ...pieSplitLeaderboardPage.rules,
        awardPool: { amount: "not-a-number", currency: CurrencyIds.USDC },
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

describe("makeReferralProgramEditionSummarySchema", () => {
  const schema = makeReferralProgramEditionSummarySchema();

  const subregistryId = {
    chainId: 1,
    address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
  };

  const pieSplitSummary = {
    awardModel: ReferralProgramAwardModels.PieSplit,
    slug: "2025-12",
    displayName: "December 2025",
    status: ReferralProgramEditionStatuses.Active,
    rules: {
      awardModel: ReferralProgramAwardModels.PieSplit,
      awardPool: parseUsdc("1000"),
      maxQualifiedReferrers: 100,
      startTime: 1000000,
      endTime: 2000000,
      subregistryId,
      rulesUrl: "https://ensawards.org/rules",
      areAwardsDistributed: false,
    },
  };

  const revShareCapSummary = {
    awardModel: ReferralProgramAwardModels.RevShareCap,
    slug: "2026-01",
    displayName: "January 2026",
    status: ReferralProgramEditionStatuses.Active,
    rules: {
      awardModel: ReferralProgramAwardModels.RevShareCap,
      awardPool: parseUsdc("2000"),
      minBaseRevenueContribution: parseUsdc("10"),
      baseAnnualRevenueContribution: parseUsdc("5"),
      maxBaseRevenueShare: 0.5,
      startTime: 1000000,
      endTime: 2000000,
      subregistryId,
      rulesUrl: "https://ensawards.org/rules",
      areAwardsDistributed: false,
    },
    awardPoolRemaining: parseUsdc("2000"),
  };

  it("parses a known pie-split edition summary correctly", () => {
    const result = schema.parse(pieSplitSummary);

    expect(result.awardModel).toBe(ReferralProgramAwardModels.PieSplit);
    expect(result.slug).toBe("2025-12");
    expect(result.status).toBe(ReferralProgramEditionStatuses.Active);
    expect(result.rules.awardModel).toBe(ReferralProgramAwardModels.PieSplit);
  });

  it("parses a known rev-share-cap edition summary correctly, including awardPoolRemaining", () => {
    const result = schema.parse(revShareCapSummary);

    expect(result.awardModel).toBe(ReferralProgramAwardModels.RevShareCap);
    if (result.awardModel !== ReferralProgramAwardModels.RevShareCap) throw new Error();
    expect(result.awardPoolRemaining.amount).toBe(parseUsdc("2000").amount);
    expect(result.status).toBe(ReferralProgramEditionStatuses.Active);
  });

  it("parses Exhausted status on a rev-share-cap edition summary", () => {
    const result = schema.parse({
      ...revShareCapSummary,
      status: ReferralProgramEditionStatuses.Exhausted,
      awardPoolRemaining: parseUsdc("0"),
    });

    expect(result.status).toBe(ReferralProgramEditionStatuses.Exhausted);
  });

  it("wraps an unknown awardModel as ReferralProgramEditionSummaryUnrecognized", () => {
    const input = {
      awardModel: "future-model",
      slug: "2026-03",
      displayName: "March 2026",
      status: ReferralProgramEditionStatuses.Scheduled,
      rules: {
        awardModel: "future-model",
        startTime: 2000000,
        endTime: 3000000,
        subregistryId,
        rulesUrl: "https://ensawards.org/rules",
        areAwardsDistributed: false,
        someNewField: "extra-data",
      },
    };

    const result = schema.parse(input);

    expect(result.awardModel).toBe(ReferralProgramAwardModels.Unrecognized);
    expect((result as ReferralProgramEditionSummaryUnrecognized).rules.originalAwardModel).toBe(
      "future-model",
    );
    expect(result.slug).toBe("2026-03");
    expect(result.status).toBe(ReferralProgramEditionStatuses.Scheduled);
  });

  it("fails when a known awardModel has invalid fields", () => {
    const invalid = {
      ...pieSplitSummary,
      rules: {
        ...pieSplitSummary.rules,
        endTime: 500000, // endTime < startTime → refine violation
      },
    };

    expect(() => schema.parse(invalid)).toThrow();
  });

  it("fails when an unknown awardModel is missing required base fields", () => {
    const input = {
      awardModel: "future-model",
      // slug, displayName, status, rules all missing
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
    awardPool: parseUsdc("1000"),
    maxQualifiedReferrers: 100,
    startTime: 1000000,
    endTime: 2000000,
    subregistryId,
    rulesUrl: "https://ensawards.org/rules",
    areAwardsDistributed: false,
  };

  const pieSplitAggregatedMetrics = {
    grandTotalReferrals: 5,
    grandTotalIncrementalDuration: 100,
    grandTotalRevenueContribution: parseEth("500"),
    grandTotalQualifiedReferrersFinalScore: 1.65,
    minFinalScoreToQualify: 0,
  };

  const revShareCapReferrerAddress = "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85";

  const revShareCapRules = {
    awardModel: ReferralProgramAwardModels.RevShareCap,
    awardPool: parseUsdc("2000"),
    minBaseRevenueContribution: parseUsdc("10"),
    baseAnnualRevenueContribution: parseUsdc("5"),
    maxBaseRevenueShare: 0.5,
    startTime: 1000000,
    endTime: 2000000,
    subregistryId,
    rulesUrl: "https://ensawards.org/rules",
    areAwardsDistributed: false,
  };

  const revShareCapAggregatedMetrics = {
    grandTotalReferrals: 3,
    grandTotalIncrementalDuration: 60,
    grandTotalRevenueContribution: parseEth("300"),
    awardPoolRemaining: parseUsdc("1800"),
  };

  const disqualificationAction = {
    actionType: AdminActionTypes.Disqualification,
    referrer: revShareCapReferrerAddress,
    reason: "Self-referral",
  };

  const warningAction = {
    actionType: AdminActionTypes.Warning,
    referrer: revShareCapReferrerAddress,
    reason: "Suspicious activity",
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
      status: ReferralProgramEditionStatuses.Active,
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
      status: ReferralProgramEditionStatuses.Active,
      accurateAsOf: 1500000,
    };

    const result = schema.parse(input);

    expect(result.awardModel).toBe(ReferralProgramAwardModels.PieSplit);
    if (result.awardModel !== ReferralProgramAwardModels.PieSplit) throw new Error();
    expect(result.type).toBe(ReferrerEditionMetricsTypeIds.Unranked);
  });

  it("parses a known rev-share-cap ranked edition metrics correctly", () => {
    const input = {
      awardModel: ReferralProgramAwardModels.RevShareCap,
      type: ReferrerEditionMetricsTypeIds.Ranked,
      rules: revShareCapRules,
      referrer: {
        referrer: revShareCapReferrerAddress,
        totalReferrals: 3,
        totalIncrementalDuration: 60,
        totalRevenueContribution: parseEth("300"),
        totalBaseRevenueContribution: parseUsdc("150"),
        rank: 1,
        isQualified: true,
        uncappedAward: parseUsdc("200"),
        cappedAward: parseUsdc("200"),
        adminAction: null,
      },
      aggregatedMetrics: revShareCapAggregatedMetrics,
      status: ReferralProgramEditionStatuses.Active,
      accurateAsOf: 1500000,
    };

    const result = schema.parse(input);

    expect(result.awardModel).toBe(ReferralProgramAwardModels.RevShareCap);
    if (result.awardModel !== ReferralProgramAwardModels.RevShareCap) throw new Error();
    expect(result.type).toBe(ReferrerEditionMetricsTypeIds.Ranked);
  });

  it("parses rev-share-cap ranked with Disqualification adminAction", () => {
    const input = {
      awardModel: ReferralProgramAwardModels.RevShareCap,
      type: ReferrerEditionMetricsTypeIds.Ranked,
      rules: { ...revShareCapRules, adminActions: [disqualificationAction] },
      referrer: {
        referrer: revShareCapReferrerAddress,
        totalReferrals: 3,
        totalIncrementalDuration: 60,
        totalRevenueContribution: parseEth("300"),
        totalBaseRevenueContribution: parseUsdc("150"),
        rank: 3,
        isQualified: false,
        uncappedAward: parseUsdc("200"),
        cappedAward: parseUsdc("0"),
        adminAction: disqualificationAction,
      },
      aggregatedMetrics: { ...revShareCapAggregatedMetrics, awardPoolRemaining: parseUsdc("2000") },
      status: ReferralProgramEditionStatuses.Active,
      accurateAsOf: 1500000,
    };

    const result = schema.parse(input);
    expect(result.awardModel).toBe(ReferralProgramAwardModels.RevShareCap);
  });

  it("parses rev-share-cap ranked with Warning adminAction", () => {
    const input = {
      awardModel: ReferralProgramAwardModels.RevShareCap,
      type: ReferrerEditionMetricsTypeIds.Ranked,
      rules: { ...revShareCapRules, adminActions: [warningAction] },
      referrer: {
        referrer: revShareCapReferrerAddress,
        totalReferrals: 3,
        totalIncrementalDuration: 60,
        totalRevenueContribution: parseEth("300"),
        totalBaseRevenueContribution: parseUsdc("150"),
        rank: 1,
        isQualified: true,
        uncappedAward: parseUsdc("200"),
        cappedAward: parseUsdc("200"),
        adminAction: warningAction,
      },
      aggregatedMetrics: revShareCapAggregatedMetrics,
      status: ReferralProgramEditionStatuses.Active,
      accurateAsOf: 1500000,
    };

    const result = schema.parse(input);
    expect(result.awardModel).toBe(ReferralProgramAwardModels.RevShareCap);
  });

  it("fails when Disqualification adminAction has isQualified=true or non-zero cappedAward", () => {
    const input = {
      awardModel: ReferralProgramAwardModels.RevShareCap,
      type: ReferrerEditionMetricsTypeIds.Ranked,
      rules: { ...revShareCapRules, adminActions: [disqualificationAction] },
      referrer: {
        referrer: revShareCapReferrerAddress,
        totalReferrals: 3,
        totalIncrementalDuration: 60,
        totalRevenueContribution: parseEth("300"),
        totalBaseRevenueContribution: parseUsdc("150"),
        rank: 1,
        isQualified: true,
        uncappedAward: parseUsdc("200"),
        cappedAward: parseUsdc("200"),
        adminAction: disqualificationAction,
      },
      aggregatedMetrics: revShareCapAggregatedMetrics,
      status: ReferralProgramEditionStatuses.Active,
      accurateAsOf: 1500000,
    };

    const result = schema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        path: ["referrer", "adminAction"],
        message: expect.stringContaining(
          "isQualified must be false and cappedAward.amount must be 0",
        ),
      }),
    );
  });

  it("fails when adminAction.referrer does not match outer referrer", () => {
    const input = {
      awardModel: ReferralProgramAwardModels.RevShareCap,
      type: ReferrerEditionMetricsTypeIds.Ranked,
      rules: { ...revShareCapRules, adminActions: [warningAction] },
      referrer: {
        referrer: revShareCapReferrerAddress,
        totalReferrals: 3,
        totalIncrementalDuration: 60,
        totalRevenueContribution: parseEth("300"),
        totalBaseRevenueContribution: parseUsdc("150"),
        rank: 1,
        isQualified: true,
        uncappedAward: parseUsdc("200"),
        cappedAward: parseUsdc("200"),
        adminAction: {
          ...warningAction,
          referrer: "0x0000000000000000000000000000000000000001",
        },
      },
      aggregatedMetrics: revShareCapAggregatedMetrics,
      status: ReferralProgramEditionStatuses.Active,
      accurateAsOf: 1500000,
    };

    const result = schema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        path: ["referrer", "adminAction", "referrer"],
        message: expect.stringContaining("adminAction.referrer must match"),
      }),
    );
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
      status: ReferralProgramEditionStatuses.Active,
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
