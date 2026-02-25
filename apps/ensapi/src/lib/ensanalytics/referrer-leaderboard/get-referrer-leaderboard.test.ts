import {
  buildReferralProgramRules,
  ENS_HOLIDAY_AWARDS_MAX_QUALIFIED_REFERRERS,
  ENS_HOLIDAY_AWARDS_TOTAL_AWARD_POOL_VALUE,
  type ReferrerLeaderboard,
} from "@namehash/ens-referrals";
import { getUnixTime } from "date-fns";
import { describe, expect, it, vi } from "vitest";

import * as database from "./database";
import { getReferrerLeaderboard } from "./get-referrer-leaderboard";
import { dbResultsReferrerLeaderboard } from "./mocks";

// Mock the database module
vi.mock("./database", () => ({
  getReferrerMetrics: vi.fn(),
}));

const rules = buildReferralProgramRules(
  ENS_HOLIDAY_AWARDS_TOTAL_AWARD_POOL_VALUE,
  ENS_HOLIDAY_AWARDS_MAX_QUALIFIED_REFERRERS,
  getUnixTime("2025-01-01T00:00:00Z"),
  getUnixTime("2025-12-31T23:59:59Z"),
  {
    chainId: 1,
    address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
  },
);

const accurateAsOf = getUnixTime("2025-11-30T23:59:59Z");

describe("ENSAnalytics Referrer Leaderboard", () => {
  describe("getReferrerLeaderboard", () => {
    it("returns a leaderboard of referrers in the requested time period", async () => {
      vi.mocked(database.getReferrerMetrics).mockResolvedValue(dbResultsReferrerLeaderboard);

      const result = await getReferrerLeaderboard(rules, accurateAsOf);

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

      // Assert `finalScoreBoost`
      // All qualified referrers except the last have boost > 0; the last qualified referrer
      // receives boost === 0 by design (formula: 1 - (rank-1)/(maxQualifiedReferrers-1)).
      const topQualifiedReferrers = qualifiedReferrers.slice(0, -1);
      const lastQualifiedReferrer = qualifiedReferrers.at(-1);
      expect(topQualifiedReferrers.every(([_, referrer]) => referrer.finalScoreBoost > 0)).toBe(
        true,
      );
      expect(lastQualifiedReferrer![1].finalScoreBoost).toBe(0);
      expect(unqualifiedReferrers.every(([_, referrer]) => referrer.finalScoreBoost === 0)).toBe(
        true,
      );

      // Assert `finalScore`
      expect(
        qualifiedReferrers.every(
          ([_, referrer]) =>
            referrer.finalScore === referrer.score * (1 + referrer.finalScoreBoost),
        ),
      ).toBe(true);
      expect(
        unqualifiedReferrers.every(([_, referrer]) => referrer.finalScore === referrer.score),
      ).toBe(true);

      /**
       * Assert {@link AwardedReferrerMetrics}.
       */

      // Assert `awardPoolShare`
      expect(qualifiedReferrers.every(([_, referrer]) => referrer.awardPoolShare > 0)).toBe(true);
      expect(unqualifiedReferrers.every(([_, referrer]) => referrer.awardPoolShare === 0)).toBe(
        true,
      );

      // Assert `awardPoolApproxValue`
      expect(qualifiedReferrers.every(([_, referrer]) => referrer.awardPoolApproxValue > 0)).toBe(
        true,
      );
      expect(
        unqualifiedReferrers.every(([_, referrer]) => referrer.awardPoolApproxValue === 0),
      ).toBe(true);
    });

    it("returns an empty list if no referrer leaderboard records were found in database", async () => {
      vi.mocked(database.getReferrerMetrics).mockResolvedValue([]);

      const result = await getReferrerLeaderboard(rules, accurateAsOf);

      expect(result).toMatchObject({
        aggregatedMetrics: {
          grandTotalIncrementalDuration: 0,
          grandTotalRevenueContribution: 0n,
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
