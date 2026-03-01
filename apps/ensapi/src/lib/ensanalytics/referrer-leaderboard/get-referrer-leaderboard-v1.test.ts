import {
  buildReferralProgramRulesPieSplit,
  ReferralProgramAwardModels,
  type ReferrerLeaderboard,
} from "@namehash/ens-referrals/v1";
import { describe, expect, it, vi } from "vitest";

import { parseTimestamp, parseUsdc } from "@ensnode/ensnode-sdk";

import * as database from "./database-v1";
import { getReferrerLeaderboard } from "./get-referrer-leaderboard-v1";
import { dbResultsReferrerLeaderboard } from "./mocks-v1";

// Mock the database module
vi.mock("./database-v1", () => ({
  getReferrerMetrics: vi.fn(),
}));

const rules = buildReferralProgramRulesPieSplit(
  parseUsdc("10000"),
  10, // maxQualifiedReferrers
  parseTimestamp("2025-01-01T00:00:00Z"),
  parseTimestamp("2025-12-31T23:59:59Z"),
  {
    chainId: 1,
    address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
  },
  new URL("https://example.com/rules"),
);

const accurateAsOf = parseTimestamp("2025-11-30T23:59:59Z");

describe("ENSAnalytics Referrer Leaderboard", () => {
  describe("getReferrerLeaderboard", () => {
    it("returns a leaderboard of referrers in the requested time period", async () => {
      vi.mocked(database.getReferrerMetrics).mockResolvedValue(dbResultsReferrerLeaderboard);

      const result = await getReferrerLeaderboard(rules, accurateAsOf);

      expect(result.awardModel).toBe(ReferralProgramAwardModels.PieSplit);
      if (result.awardModel !== ReferralProgramAwardModels.PieSplit) {
        throw new Error("Expected PieSplit leaderboard");
      }

      expect(result).toMatchObject({
        rules,
      });

      // result.referrers is expected to be in rank order (rank 1 first), matching Map insertion order
      const referrerEntries = Array.from(result.referrers.entries());
      const qualifiedReferrers = referrerEntries.slice(0, rules.maxQualifiedReferrers);
      const unqualifiedReferrers = referrerEntries.slice(rules.maxQualifiedReferrers);

      /**
       * Assert {@link RankedReferrerMetrics}.
       */

      // Assert `rank`
      expect(
        qualifiedReferrers.every(([_, referrer]) => referrer.rank <= rules.maxQualifiedReferrers),
      ).toBe(true);
      expect(
        unqualifiedReferrers.every(([_, referrer]) => referrer.rank > rules.maxQualifiedReferrers),
      ).toBe(true);

      // Assert `isQualified` flag
      expect(qualifiedReferrers.every(([_, referrer]) => referrer.isQualified)).toBe(true);
      expect(unqualifiedReferrers.every(([_, referrer]) => !referrer.isQualified)).toBe(true);

      // Assert `finalScoreBoost` (pie-split specific)
      // All qualified referrers except the last have boost > 0; the last qualified referrer
      // receives boost === 0 by design (formula: 1 - (rank-1)/(maxQualifiedReferrers-1)),
      // but only when the qualified slots are fully filled (length === maxQualifiedReferrers).
      // With fewer referrers, the last qualified referrer is below the cutoff rank and has boost > 0.
      const topQualifiedReferrers = qualifiedReferrers.slice(0, -1);
      const lastQualifiedReferrer = qualifiedReferrers.at(-1);
      expect(topQualifiedReferrers.every(([_, r]) => r.finalScoreBoost > 0)).toBe(true);
      if (qualifiedReferrers.length === rules.maxQualifiedReferrers) {
        expect(lastQualifiedReferrer![1].finalScoreBoost).toBe(0);
      }
      expect(unqualifiedReferrers.every(([_, r]) => r.finalScoreBoost === 0)).toBe(true);

      // Assert `finalScore` (pie-split specific)
      expect(
        qualifiedReferrers.every(([_, r]) => r.finalScore === r.score * (1 + r.finalScoreBoost)),
      ).toBe(true);
      expect(unqualifiedReferrers.every(([_, r]) => r.finalScore === r.score)).toBe(true);

      /**
       * Assert {@link AwardedReferrerMetrics}.
       */

      // Assert `awardPoolShare` (pie-split specific)
      expect(qualifiedReferrers.every(([_, r]) => r.awardPoolShare > 0)).toBe(true);
      expect(unqualifiedReferrers.every(([_, r]) => r.awardPoolShare === 0)).toBe(true);

      // Assert `awardPoolApproxValue`
      expect(
        qualifiedReferrers.every(([_, referrer]) => referrer.awardPoolApproxValue.amount > 0),
      ).toBe(true);
      expect(
        unqualifiedReferrers.every(
          ([_, referrer]) => referrer.awardPoolApproxValue.amount === BigInt(0),
        ),
      ).toBe(true);
    });

    it("returns an empty list if no referrer leaderboard records were found in database", async () => {
      vi.mocked(database.getReferrerMetrics).mockResolvedValue([]);

      const result = await getReferrerLeaderboard(rules, accurateAsOf);

      expect(result).toMatchObject({
        awardModel: rules.awardModel,
        aggregatedMetrics: {
          grandTotalIncrementalDuration: 0,
          grandTotalRevenueContribution: {
            currency: "ETH" as const,
            amount: 0n,
          },
          grandTotalQualifiedReferrersFinalScore: 0,
          grandTotalReferrals: 0,
          minFinalScoreToQualify: 0,
        },
        referrers: new Map(),
        rules,
        accurateAsOf,
      } satisfies ReferrerLeaderboard);
    });
  });
});
