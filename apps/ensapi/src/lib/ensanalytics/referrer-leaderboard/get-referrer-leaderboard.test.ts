import type { USDQuantity } from "@namehash/ens-referrals";
import { getUnixTime } from "date-fns";
import { describe, expect, it, vi } from "vitest";

import type { AccountId, UnixTimestamp } from "@ensnode/ensnode-sdk";

import * as database from "./database";
import { getReferrerLeaderboard } from "./get-referrer-leaderboard";
import { dbResultsReferrerLeaderboard } from "./mocks";

// Mock the database module
vi.mock("./database", () => ({
  getReferrerLeaderboardRecords: vi.fn(),
}));

describe("ENSAnalytics Referrer Leaderboard", () => {
  describe("getReferrerLeaderboard", () => {
    const totalAwardPoolValue: USDQuantity = 10_000;
    const maxQualifiedReferrers: number = 10;
    const startTime: UnixTimestamp = getUnixTime("2025-01-01T00:00:00Z");
    const endTime: UnixTimestamp = getUnixTime("2025-12-31T23:59:59Z");
    const subregistryId: AccountId = {
      chainId: 1,
      address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    };
    const chainIndexingStatusCursor: UnixTimestamp = getUnixTime("2025-11-30T23:59:59Z");

    it("returns a list with TOP N referrers in the requested time period", async () => {
      vi.mocked(database.getReferrerLeaderboardRecords).mockResolvedValue(
        dbResultsReferrerLeaderboard,
      );

      const result = await getReferrerLeaderboard(
        totalAwardPoolValue,
        maxQualifiedReferrers,
        startTime,
        endTime,
        subregistryId,
        chainIndexingStatusCursor,
      );

      expect(result).toMatchObject({
        rules: {
          totalAwardPoolValue,
          maxQualifiedReferrers,
          startTime,
          endTime,
        },
        updatedAt: chainIndexingStatusCursor,
      });

      const referrers = result.referrers.entries();
      const qualifiedReferrers = referrers.take(maxQualifiedReferrers);
      const unqualifiedReferrers = referrers.drop(maxQualifiedReferrers);

      /**
       * Assert {@link RankedReferrerMetrics}.
       */

      // Assert `rank`
      expect(
        qualifiedReferrers.every(([_, referrer]) => referrer.rank <= maxQualifiedReferrers),
      ).toBe(true);
      expect(
        unqualifiedReferrers.every(([_, referrer]) => referrer.rank > maxQualifiedReferrers),
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
  });
});
