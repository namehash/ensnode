import { testClient } from "hono/testing";
import { describe, expect, it, vi } from "vitest"; // Or your preferred test runner

import { ENSNamespaceIds } from "@ensnode/datasources";

import type { EnsApiConfig } from "@/config/config.schema";

import * as middleware from "../middleware/referrer-leaderboard.middleware-v1";

vi.mock("@/config", () => ({
  get default() {
    const mockedConfig: Pick<EnsApiConfig, "ensIndexerUrl" | "namespace"> = {
      ensIndexerUrl: new URL("https://ensnode.example.com"),
      namespace: ENSNamespaceIds.Mainnet,
    };

    return mockedConfig;
  },
}));

vi.mock("../middleware/referrer-leaderboard.middleware-v1", () => ({
  referrerLeaderboardMiddlewareV1: vi.fn(),
}));

import {
  deserializeReferrerDetailAllCyclesResponse,
  deserializeReferrerLeaderboardPageResponse,
  type ReferralProgramCycleId,
  ReferrerDetailAllCyclesResponseCodes,
  type ReferrerDetailAllCyclesResponseOk,
  ReferrerDetailTypeIds,
  type ReferrerLeaderboard,
  ReferrerLeaderboardPageResponseCodes,
  type ReferrerLeaderboardPageResponseOk,
} from "@namehash/ens-referrals/v1";

import type { SWRCache } from "@ensnode/ensnode-sdk";

import {
  emptyReferralLeaderboard,
  populatedReferrerLeaderboard,
  referrerLeaderboardPageResponseOk,
} from "@/lib/ensanalytics/referrer-leaderboard/mocks-v1";

import app from "./ensanalytics-api-v1";

describe("/ensanalytics/v1", () => {
  describe("/referral-leaderboard", () => {
    it("returns requested records when referrer leaderboard has multiple pages of data", async () => {
      // Arrange: mock cache map with cycle-1
      const mockCyclesCaches = new Map<ReferralProgramCycleId, SWRCache<ReferrerLeaderboard>>([
        [
          "cycle-1",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      vi.mocked(middleware.referrerLeaderboardMiddlewareV1).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: all possible referrers on a single page response
      const allPossibleReferrers = referrerLeaderboardPageResponseOk.data.referrers;
      const allPossibleReferrersIterator = allPossibleReferrers[Symbol.iterator]();

      // Arrange: create the test client from the app instance
      const client = testClient(app);
      const recordsPerPage = 10;
      const cycle = "cycle-1";

      // Act: send test request to fetch 1st page
      const responsePage1 = await client["referral-leaderboard"]
        .$get({ query: { cycle, recordsPerPage: `${recordsPerPage}`, page: "1" } }, {})
        .then((r) => r.json())
        .then(deserializeReferrerLeaderboardPageResponse);

      // Act: send test request to fetch 2nd page
      const responsePage2 = await client["referral-leaderboard"]
        .$get({ query: { cycle, recordsPerPage: `${recordsPerPage}`, page: "2" } }, {})
        .then((r) => r.json())
        .then(deserializeReferrerLeaderboardPageResponse);

      // Act: send test request to fetch 3rd page
      const responsePage3 = await client["referral-leaderboard"]
        .$get({ query: { cycle, recordsPerPage: `${recordsPerPage}`, page: "3" } }, {})
        .then((r) => r.json())
        .then(deserializeReferrerLeaderboardPageResponse);

      // Assert: 1st page results
      const expectedResponsePage1 = {
        responseCode: ReferrerLeaderboardPageResponseCodes.Ok,
        data: {
          ...populatedReferrerLeaderboard,
          pageContext: {
            endIndex: 9,
            hasNext: true,
            hasPrev: false,
            recordsPerPage: 10,
            page: 1,
            startIndex: 0,
            totalPages: 3,
            totalRecords: 29,
          },
          referrers: allPossibleReferrersIterator.take(recordsPerPage).toArray(),
        },
      } satisfies ReferrerLeaderboardPageResponseOk;

      expect(responsePage1).toMatchObject(expectedResponsePage1);

      // Assert: 2nd page results
      const expectedResponsePage2 = {
        responseCode: ReferrerLeaderboardPageResponseCodes.Ok,
        data: {
          ...populatedReferrerLeaderboard,
          pageContext: {
            endIndex: 19,
            hasNext: true,
            hasPrev: true,
            recordsPerPage: 10,
            page: 2,
            startIndex: 10,
            totalPages: 3,
            totalRecords: 29,
          },
          referrers: allPossibleReferrersIterator.take(recordsPerPage).toArray(),
        },
      } satisfies ReferrerLeaderboardPageResponseOk;
      expect(responsePage2).toMatchObject(expectedResponsePage2);

      // Assert: 3rd page results
      const expectedResponsePage3 = {
        responseCode: ReferrerLeaderboardPageResponseCodes.Ok,
        data: {
          ...populatedReferrerLeaderboard,
          pageContext: {
            endIndex: 28,
            hasNext: false,
            hasPrev: true,
            recordsPerPage: 10,
            page: 3,
            startIndex: 20,
            totalPages: 3,
            totalRecords: 29,
          },
          referrers: allPossibleReferrersIterator.take(recordsPerPage).toArray(),
        },
      } satisfies ReferrerLeaderboardPageResponseOk;
      expect(responsePage3).toMatchObject(expectedResponsePage3);
    });

    it("returns empty cached referrer leaderboard when there are no referrals yet", async () => {
      // Arrange: mock cache map with cycle-1
      const mockCyclesCaches = new Map<ReferralProgramCycleId, SWRCache<ReferrerLeaderboard>>([
        [
          "cycle-1",
          {
            read: async () => emptyReferralLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      vi.mocked(middleware.referrerLeaderboardMiddlewareV1).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: create the test client from the app instance
      const client = testClient(app);
      const recordsPerPage = 10;
      const cycle = "cycle-1";

      // Act: send test request to fetch 1st page
      const response = await client["referral-leaderboard"]
        .$get({ query: { cycle, recordsPerPage: `${recordsPerPage}`, page: "1" } }, {})
        .then((r) => r.json())
        .then(deserializeReferrerLeaderboardPageResponse);

      // Assert: empty page results
      const expectedResponse = {
        responseCode: ReferrerLeaderboardPageResponseCodes.Ok,
        data: {
          ...emptyReferralLeaderboard,
          pageContext: {
            hasNext: false,
            hasPrev: false,
            recordsPerPage: 10,
            page: 1,
            totalPages: 1,
            totalRecords: 0,
          },
          referrers: [],
        },
      } satisfies ReferrerLeaderboardPageResponseOk;

      expect(response).toMatchObject(expectedResponse);
    });
  });

  describe("/referral-leaderboard/:referrer", () => {
    it("returns referrer metrics for all cycles when referrer exists", async () => {
      // Arrange: mock cache map with multiple cycles
      const mockCyclesCaches = new Map<ReferralProgramCycleId, SWRCache<ReferrerLeaderboard>>([
        [
          "cycle-1",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
        [
          "cycle-2",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      vi.mocked(middleware.referrerLeaderboardMiddlewareV1).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: use a referrer address that exists in the leaderboard (rank 1)
      const existingReferrer = "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e";
      const expectedMetrics = populatedReferrerLeaderboard.referrers.get(existingReferrer)!;
      const expectedAccurateAsOf = populatedReferrerLeaderboard.accurateAsOf;

      // Act: send test request to fetch referrer detail for all cycles
      const httpResponse = await app.request(`/referral-leaderboard/${existingReferrer}`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailAllCyclesResponse(responseData);

      // Assert: response contains the expected referrer metrics for all cycles
      const expectedResponse = {
        responseCode: ReferrerDetailAllCyclesResponseCodes.Ok,
        data: {
          "cycle-1": {
            type: ReferrerDetailTypeIds.Ranked,
            rules: populatedReferrerLeaderboard.rules,
            referrer: expectedMetrics,
            aggregatedMetrics: populatedReferrerLeaderboard.aggregatedMetrics,
            accurateAsOf: expectedAccurateAsOf,
          },
          "cycle-2": {
            type: ReferrerDetailTypeIds.Ranked,
            rules: populatedReferrerLeaderboard.rules,
            referrer: expectedMetrics,
            aggregatedMetrics: populatedReferrerLeaderboard.aggregatedMetrics,
            accurateAsOf: expectedAccurateAsOf,
          },
        },
      } satisfies ReferrerDetailAllCyclesResponseOk;

      expect(response).toMatchObject(expectedResponse);
    });

    it("returns zero-score metrics for all cycles when referrer does not exist", async () => {
      // Arrange: mock cache map with multiple cycles
      const mockCyclesCaches = new Map<ReferralProgramCycleId, SWRCache<ReferrerLeaderboard>>([
        [
          "cycle-1",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
        [
          "cycle-2",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      vi.mocked(middleware.referrerLeaderboardMiddlewareV1).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: use a referrer address that does NOT exist in the leaderboard
      const nonExistingReferrer = "0x0000000000000000000000000000000000000099";

      // Act: send test request to fetch referrer detail
      const httpResponse = await app.request(`/referral-leaderboard/${nonExistingReferrer}`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailAllCyclesResponse(responseData);

      // Assert: response contains zero-score metrics for the referrer across all cycles
      const expectedAccurateAsOf = populatedReferrerLeaderboard.accurateAsOf;

      expect(response.responseCode).toBe(ReferrerDetailAllCyclesResponseCodes.Ok);
      if (response.responseCode === ReferrerDetailAllCyclesResponseCodes.Ok) {
        // Check cycle-1
        expect(response.data["cycle-1"].type).toBe(ReferrerDetailTypeIds.Unranked);
        expect(response.data["cycle-1"].rules).toEqual(populatedReferrerLeaderboard.rules);
        expect(response.data["cycle-1"].aggregatedMetrics).toEqual(
          populatedReferrerLeaderboard.aggregatedMetrics,
        );
        expect(response.data["cycle-1"].referrer.referrer).toBe(nonExistingReferrer);
        expect(response.data["cycle-1"].referrer.rank).toBe(null);
        expect(response.data["cycle-1"].referrer.totalReferrals).toBe(0);
        expect(response.data["cycle-1"].referrer.totalIncrementalDuration).toBe(0);
        expect(response.data["cycle-1"].referrer.score).toBe(0);
        expect(response.data["cycle-1"].referrer.isQualified).toBe(false);
        expect(response.data["cycle-1"].referrer.finalScoreBoost).toBe(0);
        expect(response.data["cycle-1"].referrer.finalScore).toBe(0);
        expect(response.data["cycle-1"].referrer.awardPoolShare).toBe(0);
        expect(response.data["cycle-1"].referrer.awardPoolApproxValue).toStrictEqual({
          currency: "USDC",
          amount: 0n,
        });
        expect(response.data["cycle-1"].accurateAsOf).toBe(expectedAccurateAsOf);

        // Check cycle-2
        expect(response.data["cycle-2"].type).toBe(ReferrerDetailTypeIds.Unranked);
        expect(response.data["cycle-2"].referrer.referrer).toBe(nonExistingReferrer);
        expect(response.data["cycle-2"].referrer.rank).toBe(null);
      }
    });

    it("returns zero-score metrics for all cycles when leaderboards are empty", async () => {
      // Arrange: mock cache map with multiple cycles, all empty
      const mockCyclesCaches = new Map<ReferralProgramCycleId, SWRCache<ReferrerLeaderboard>>([
        [
          "cycle-1",
          {
            read: async () => emptyReferralLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
        [
          "cycle-2",
          {
            read: async () => emptyReferralLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      vi.mocked(middleware.referrerLeaderboardMiddlewareV1).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: use any referrer address
      const referrer = "0x0000000000000000000000000000000000000001";

      // Act: send test request to fetch referrer detail
      const httpResponse = await app.request(`/referral-leaderboard/${referrer}`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailAllCyclesResponse(responseData);

      // Assert: response contains zero-score metrics for the referrer across all cycles
      const expectedAccurateAsOf = emptyReferralLeaderboard.accurateAsOf;

      expect(response.responseCode).toBe(ReferrerDetailAllCyclesResponseCodes.Ok);
      if (response.responseCode === ReferrerDetailAllCyclesResponseCodes.Ok) {
        // Check cycle-1
        expect(response.data["cycle-1"].type).toBe(ReferrerDetailTypeIds.Unranked);
        expect(response.data["cycle-1"].rules).toEqual(emptyReferralLeaderboard.rules);
        expect(response.data["cycle-1"].aggregatedMetrics).toEqual(
          emptyReferralLeaderboard.aggregatedMetrics,
        );
        expect(response.data["cycle-1"].referrer.referrer).toBe(referrer);
        expect(response.data["cycle-1"].referrer.rank).toBe(null);
        expect(response.data["cycle-1"].referrer.totalReferrals).toBe(0);
        expect(response.data["cycle-1"].referrer.totalIncrementalDuration).toBe(0);
        expect(response.data["cycle-1"].referrer.score).toBe(0);
        expect(response.data["cycle-1"].referrer.isQualified).toBe(false);
        expect(response.data["cycle-1"].referrer.finalScoreBoost).toBe(0);
        expect(response.data["cycle-1"].referrer.finalScore).toBe(0);
        expect(response.data["cycle-1"].referrer.awardPoolShare).toBe(0);
        expect(response.data["cycle-1"].referrer.awardPoolApproxValue).toStrictEqual({
          currency: "USDC",
          amount: 0n,
        });
        expect(response.data["cycle-1"].accurateAsOf).toBe(expectedAccurateAsOf);

        // Check cycle-2
        expect(response.data["cycle-2"].type).toBe(ReferrerDetailTypeIds.Unranked);
        expect(response.data["cycle-2"].referrer.referrer).toBe(referrer);
        expect(response.data["cycle-2"].referrer.rank).toBe(null);
      }
    });

    it("returns error response when any cycle cache fails to load", async () => {
      // Arrange: mock cache map where cycle-1 succeeds but cycle-2 fails
      const mockCyclesCaches = new Map<ReferralProgramCycleId, SWRCache<ReferrerLeaderboard>>([
        [
          "cycle-1",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
        [
          "cycle-2",
          {
            read: async () => new Error("Database connection failed"),
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      vi.mocked(middleware.referrerLeaderboardMiddlewareV1).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: use any referrer address
      const referrer = "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e";

      // Act: send test request to fetch referrer detail
      const httpResponse = await app.request(`/referral-leaderboard/${referrer}`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailAllCyclesResponse(responseData);

      // Assert: response contains error mentioning the specific cycle that failed
      expect(response.responseCode).toBe(ReferrerDetailAllCyclesResponseCodes.Error);
      if (response.responseCode === ReferrerDetailAllCyclesResponseCodes.Error) {
        expect(response.error).toBe("Internal Server Error");
        expect(response.errorMessage).toContain("cycle-2");
        expect(response.errorMessage).toBe(
          "Referrer leaderboard data for cycle cycle-2 has not been successfully cached yet.",
        );
      }
    });

    it("returns error response when all cycle caches fail to load", async () => {
      // Arrange: mock cache map where all cycles fail
      const mockCyclesCaches = new Map<ReferralProgramCycleId, SWRCache<ReferrerLeaderboard>>([
        [
          "cycle-1",
          {
            read: async () => new Error("Database connection failed"),
          } as SWRCache<ReferrerLeaderboard>,
        ],
        [
          "cycle-2",
          {
            read: async () => new Error("Database connection failed"),
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      vi.mocked(middleware.referrerLeaderboardMiddlewareV1).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: use any referrer address
      const referrer = "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e";

      // Act: send test request to fetch referrer detail
      const httpResponse = await app.request(`/referral-leaderboard/${referrer}`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailAllCyclesResponse(responseData);

      // Assert: response contains error for the first cycle that failed
      expect(response.responseCode).toBe(ReferrerDetailAllCyclesResponseCodes.Error);
      if (response.responseCode === ReferrerDetailAllCyclesResponseCodes.Error) {
        expect(response.error).toBe("Internal Server Error");
        expect(response.errorMessage).toContain("cycle-1");
        expect(response.errorMessage).toBe(
          "Referrer leaderboard data for cycle cycle-1 has not been successfully cached yet.",
        );
      }
    });
  });
});
