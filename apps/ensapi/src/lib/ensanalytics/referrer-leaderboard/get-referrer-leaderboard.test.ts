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

describe("ENSAnalytics Referrer Leaderboard", () => {
  describe("getReferrerLeaderboard", () => {
    it("returns a leaderboard of referrers in the requested time period", async () => {
      vi.mocked(database.getReferrerMetrics).mockResolvedValue(dbResultsReferrerLeaderboard);

      const result = await getReferrerLeaderboard(rules);

      expect(result).toMatchObject({
        rules,
      });

      const referrers = result.referrers.entries();
      const qualifiedReferrers = referrers.take(rules.maxQualifiedReferrers);
      const unqualifiedReferrers = referrers.drop(rules.maxQualifiedReferrers);

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
      expect(qualifiedReferrers.every(([_, referrer]) => referrer.finalScoreBoost > 0)).toBe(true);
      expect(unqualifiedReferrers.every(([_, referrer]) => referrer.finalScoreBoost === 0)).toBe(
        true,
      );

      // Assert `finalScore`
      expect(
        qualifiedReferrers.every(
          ([_, referrer]) => referrer.finalScore === referrer.score * referrer.finalScoreBoost,
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

      const result = await getReferrerLeaderboard(rules);

      expect(result).toMatchObject({
        aggregatedMetrics: {
          grandTotalIncrementalDuration: 0,
          grandTotalQualifiedReferrersFinalScore: 0,
          grandTotalReferrals: 0,
          minFinalScoreToQualify: 0,
        },
        referrers: new Map(),
        rules,
      } satisfies ReferrerLeaderboard);
    });
  });
});
