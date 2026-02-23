import type { Address } from "viem";
import { describe, expect, it, vi } from "vitest";

import { priceEth, priceUsdc } from "@ensnode/ensnode-sdk";

import type { ReferrerLeaderboardPieSplit } from "./award-models/pie-split/leaderboard";
import type { AwardedReferrerMetricsPieSplit } from "./award-models/pie-split/metrics";
import {
  buildReferrerLeaderboardPageContext,
  type ReferrerLeaderboardPageContext,
  type ReferrerLeaderboardPageParams,
} from "./award-models/shared/leaderboard-page";

describe("buildReferrerLeaderboardPageContext", () => {
  const pageParams: ReferrerLeaderboardPageParams = {
    page: 1,
    recordsPerPage: 3,
  };

  it("correctly evaluates `hasNext` when `leaderboard.referrers.size` and `recordsPerPage` are equal", () => {
    const leaderboard: ReferrerLeaderboardPieSplit = {
      awardModel: "pie-split",
      rules: {
        awardModel: "pie-split",
        totalAwardPoolValue: priceUsdc(10000n),
        maxQualifiedReferrers: 10,
        startTime: 1764547200,
        endTime: 1767225599,
        subregistryId: {
          chainId: 1,
          address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        },
        rulesUrl: new URL("https://example.com/rules"),
      },
      aggregatedMetrics: {
        grandTotalReferrals: 17,
        grandTotalIncrementalDuration: 464554733,
        grandTotalRevenueContribution: priceEth(60_000_000_000_000_000n), // 0.06 ETH
        grandTotalQualifiedReferrersFinalScore: 28.05273061366773,
        minFinalScoreToQualify: 0,
      },
      referrers: new Map<Address, AwardedReferrerMetricsPieSplit>([
        [
          "0x03c098d2bed4609e6ed9beb2c4877741f45f290d",
          {
            referrer: "0x6837047f46da1d5d9a79846b25810b92adf456f6",
            totalReferrals: 1,
            totalIncrementalDuration: 189302400,
            totalRevenueContribution: priceEth(20_000_000_000_000_000n), // 0.02 ETH
            score: 5.99875425231182,
            rank: 1,
            isQualified: true,
            finalScoreBoost: 1,
            finalScore: 11.9975085046236,
            awardPoolShare: 0.333854103435154,
            awardPoolApproxValue: priceUsdc(3338n),
          },
        ],
        [
          "0xabe3fdb4d2cd5f2e7193a4ac380ecb68e899896a",
          {
            referrer: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
            totalReferrals: 10,
            totalIncrementalDuration: 155847533,
            totalRevenueContribution: priceEth(25_000_000_000_000_000n), // 0.025 ETH
            score: 4.93861172016867,
            rank: 2,
            isQualified: true,
            finalScoreBoost: 0.888888888888889,
            finalScore: 9.32848880476303,
            awardPoolShare: 0.259583418100418,
            awardPoolApproxValue: priceUsdc(2595n),
          },
        ],
        [
          "0xffa596cdf9a69676e689b1a92e5e681711227d75",
          {
            referrer: "0x7e491cde0fbf08e51f54c4fb6b9e24afbd18966d",
            totalReferrals: 6,
            totalIncrementalDuration: 119404800,
            totalRevenueContribution: priceEth(15_000_000_000_000_000n), // 0.015 ETH
            score: 3.78378748365812,
            rank: 3,
            isQualified: true,
            finalScoreBoost: 0.777777777777778,
            finalScore: 6.7267333042811,
            awardPoolShare: 0.187184490470057,
            awardPoolApproxValue: priceUsdc(1871n),
          },
        ],
      ]),
      accurateAsOf: 1764580368,
    };

    const buildReferrerLeaderboardPageContextSpy = vi.fn(buildReferrerLeaderboardPageContext);
    const result = buildReferrerLeaderboardPageContextSpy(pageParams, leaderboard);

    expect(
      buildReferrerLeaderboardPageContextSpy,
      "buildReferrerLeaderboardPageContext should successfully complete for recordsPerPage=3, leaderboard.referrers.size=3",
    ).toHaveReturned();
    expect(
      result.hasNext,
      `Leaderboard should only have one page for recordsPerPage=3, leaderboard.referrers.size=3 (expected hasNext to be false, is ${result.hasNext})`,
    ).toStrictEqual(false);
  });

  it("Correctly builds the pagination context when `leaderboard.referrers.size` is 0", () => {
    const leaderboard: ReferrerLeaderboardPieSplit = {
      awardModel: "pie-split",
      rules: {
        awardModel: "pie-split",
        totalAwardPoolValue: priceUsdc(10000n),
        maxQualifiedReferrers: 10,
        startTime: 1764547200,
        endTime: 1767225599,
        subregistryId: {
          chainId: 1,
          address: "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
        },
        rulesUrl: new URL("https://example.com/rules"),
      },
      aggregatedMetrics: {
        grandTotalReferrals: 17,
        grandTotalIncrementalDuration: 464554733,
        grandTotalRevenueContribution: priceEth(50_000_000_000_000_000n), // 0.05 ETH
        grandTotalQualifiedReferrersFinalScore: 28.05273061366773,
        minFinalScoreToQualify: 0,
      },
      referrers: new Map<Address, AwardedReferrerMetricsPieSplit>(),
      accurateAsOf: 1764580368,
    };

    const expectedResult: ReferrerLeaderboardPageContext = {
      totalRecords: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
      startIndex: undefined,
      endIndex: undefined,
      recordsPerPage: 3,
      page: 1,
    };

    const buildReferrerLeaderboardPageContextSpy = vi.fn(buildReferrerLeaderboardPageContext);
    const result = buildReferrerLeaderboardPageContextSpy(pageParams, leaderboard);

    expect(
      buildReferrerLeaderboardPageContextSpy,
      "buildReferrerLeaderboardPageContext should successfully complete for recordsPerPage=3, leaderboard.referrers.size=0",
    ).toHaveReturned();

    expect(
      result,
      `ReferrerLeaderboardPageContext result should match all edge-case requirements for leaderboard.referrers.size=0`,
    ).toStrictEqual(expectedResult);
  });
});
