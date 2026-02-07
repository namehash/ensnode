import { testClient } from "hono/testing";
import { describe, expect, it, vi } from "vitest"; // Or your preferred test runner

import { ENSNamespaceIds } from "@ensnode/datasources";

import type { EnsApiConfig } from "@/config/config.schema";

import * as cyclesCachesMiddleware from "../middleware/referral-leaderboard-cycles-caches.middleware";
import * as cycleSetMiddleware from "../middleware/referral-program-cycle-set.middleware";

vi.mock("@/config", () => ({
  get default() {
    const mockedConfig: Pick<EnsApiConfig, "ensIndexerUrl" | "namespace"> = {
      ensIndexerUrl: new URL("https://ensnode.example.com"),
      namespace: ENSNamespaceIds.Mainnet,
    };

    return mockedConfig;
  },
}));

vi.mock("../middleware/referral-program-cycle-set.middleware", () => ({
  referralProgramCycleConfigSetMiddleware: vi.fn(),
}));

vi.mock("../middleware/referral-leaderboard-cycles-caches.middleware", () => ({
  referralLeaderboardCyclesCachesMiddleware: vi.fn(),
}));

import {
  buildReferralProgramRules,
  deserializeReferralProgramCycleConfigSetResponse,
  deserializeReferrerDetailCyclesResponse,
  deserializeReferrerLeaderboardPageResponse,
  ReferralProgramCycleConfigSetResponseCodes,
  type ReferralProgramCycleSlug,
  ReferrerDetailCyclesResponseCodes,
  type ReferrerDetailCyclesResponseOk,
  ReferrerDetailTypeIds,
  type ReferrerLeaderboard,
  ReferrerLeaderboardPageResponseCodes,
  type ReferrerLeaderboardPageResponseOk,
} from "@namehash/ens-referrals/v1";

import { parseUsdc, type SWRCache } from "@ensnode/ensnode-sdk";

import {
  emptyReferralLeaderboard,
  populatedReferrerLeaderboard,
  referrerLeaderboardPageResponseOk,
} from "@/lib/ensanalytics/referrer-leaderboard/mocks-v1";

import app from "./ensanalytics-api-v1";

describe("/v1/ensanalytics", () => {
  describe("/referral-leaderboard", () => {
    it("returns requested records when referrer leaderboard has multiple pages of data", async () => {
      // Arrange: mock cache map with 2025-12
      const mockCyclesCaches = new Map<ReferralProgramCycleSlug, SWRCache<ReferrerLeaderboard>>([
        [
          "2025-12",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      // Mock cycle set middleware to provide a mock cycle set
      const mockCycleConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Cycle 1", rules: {} as any }],
      ]);
      vi.mocked(cycleSetMiddleware.referralProgramCycleConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramCycleConfigSet", mockCycleConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        cyclesCachesMiddleware.referralLeaderboardCyclesCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: all possible referrers on a single page response
      const allPossibleReferrers = referrerLeaderboardPageResponseOk.data.referrers;
      const allPossibleReferrersIterator = allPossibleReferrers[Symbol.iterator]();

      // Arrange: create the test client from the app instance
      const client = testClient(app);
      const recordsPerPage = 10;
      const cycle = "2025-12";

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
      // Arrange: mock cache map with 2025-12
      const mockCyclesCaches = new Map<ReferralProgramCycleSlug, SWRCache<ReferrerLeaderboard>>([
        [
          "2025-12",
          {
            read: async () => emptyReferralLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      // Mock cycle set middleware to provide a mock cycle set
      const mockCycleConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Cycle 1", rules: {} as any }],
      ]);
      vi.mocked(cycleSetMiddleware.referralProgramCycleConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramCycleConfigSet", mockCycleConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        cyclesCachesMiddleware.referralLeaderboardCyclesCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: create the test client from the app instance
      const client = testClient(app);
      const recordsPerPage = 10;
      const cycle = "2025-12";

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

    it("returns 404 error when unknown cycle slug is requested", async () => {
      // Arrange: mock cache map with test-cycle-a and test-cycle-b
      const mockCyclesCaches = new Map<ReferralProgramCycleSlug, SWRCache<ReferrerLeaderboard>>([
        [
          "test-cycle-a",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
        [
          "test-cycle-b",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      // Mock cycle set middleware to provide a mock cycle set
      const mockCycleConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Cycle 1", rules: {} as any }],
      ]);
      vi.mocked(cycleSetMiddleware.referralProgramCycleConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramCycleConfigSet", mockCycleConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        cyclesCachesMiddleware.referralLeaderboardCyclesCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: create the test client from the app instance
      const client = testClient(app);
      const recordsPerPage = 10;
      const invalidCycle = "invalid-cycle";

      // Act: send test request with invalid cycle slug
      const httpResponse = await client["referral-leaderboard"].$get(
        { query: { cycle: invalidCycle, recordsPerPage: `${recordsPerPage}`, page: "1" } },
        {},
      );
      const responseData = await httpResponse.json();
      const response = deserializeReferrerLeaderboardPageResponse(responseData);

      // Assert: response is 404 error with list of valid cycles from config
      expect(httpResponse.status).toBe(404);
      expect(response.responseCode).toBe(ReferrerLeaderboardPageResponseCodes.Error);
      if (response.responseCode === ReferrerLeaderboardPageResponseCodes.Error) {
        expect(response.error).toBe("Not Found");
        expect(response.errorMessage).toBe(
          "Unknown cycle: invalid-cycle. Valid cycles: test-cycle-a, test-cycle-b",
        );
      }
    });
  });

  describe("/referrer/:referrer", () => {
    it("returns referrer metrics for requested cycles when referrer exists", async () => {
      // Arrange: mock cache map with multiple cycles
      const mockCyclesCaches = new Map<ReferralProgramCycleSlug, SWRCache<ReferrerLeaderboard>>([
        [
          "2025-12",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
        [
          "2026-03",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      // Mock cycle set middleware to provide a mock cycle set
      const mockCycleConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Cycle 1", rules: {} as any }],
        ["2026-03", { slug: "2026-03", displayName: "Cycle 2", rules: {} as any }],
      ]);
      vi.mocked(cycleSetMiddleware.referralProgramCycleConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramCycleConfigSet", mockCycleConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        cyclesCachesMiddleware.referralLeaderboardCyclesCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: use a referrer address that exists in the leaderboard (rank 1)
      const existingReferrer = "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e";
      const expectedMetrics = populatedReferrerLeaderboard.referrers.get(existingReferrer)!;
      const expectedAccurateAsOf = populatedReferrerLeaderboard.accurateAsOf;

      // Act: send test request to fetch referrer detail for requested cycles
      const httpResponse = await app.request(
        `/referrer/${existingReferrer}?cycles=2025-12,2026-03`,
      );
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailCyclesResponse(responseData);

      // Assert: response contains the expected referrer metrics for requested cycles
      const expectedResponse = {
        responseCode: ReferrerDetailCyclesResponseCodes.Ok,
        data: {
          "2025-12": {
            type: ReferrerDetailTypeIds.Ranked,
            rules: populatedReferrerLeaderboard.rules,
            referrer: expectedMetrics,
            aggregatedMetrics: populatedReferrerLeaderboard.aggregatedMetrics,
            accurateAsOf: expectedAccurateAsOf,
          },
          "2026-03": {
            type: ReferrerDetailTypeIds.Ranked,
            rules: populatedReferrerLeaderboard.rules,
            referrer: expectedMetrics,
            aggregatedMetrics: populatedReferrerLeaderboard.aggregatedMetrics,
            accurateAsOf: expectedAccurateAsOf,
          },
        },
      } satisfies ReferrerDetailCyclesResponseOk;

      expect(response).toMatchObject(expectedResponse);
    });

    it("returns zero-score metrics for requested cycles when referrer does not exist", async () => {
      // Arrange: mock cache map with multiple cycles
      const mockCyclesCaches = new Map<ReferralProgramCycleSlug, SWRCache<ReferrerLeaderboard>>([
        [
          "2025-12",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
        [
          "2026-03",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      // Mock cycle set middleware to provide a mock cycle set
      const mockCycleConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Cycle 1", rules: {} as any }],
        ["2026-03", { slug: "2026-03", displayName: "Cycle 2", rules: {} as any }],
      ]);
      vi.mocked(cycleSetMiddleware.referralProgramCycleConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramCycleConfigSet", mockCycleConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        cyclesCachesMiddleware.referralLeaderboardCyclesCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: use a referrer address that does NOT exist in the leaderboard
      const nonExistingReferrer = "0x0000000000000000000000000000000000000099";

      // Act: send test request to fetch referrer detail
      const httpResponse = await app.request(
        `/referrer/${nonExistingReferrer}?cycles=2025-12,2026-03`,
      );
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailCyclesResponse(responseData);

      // Assert: response contains zero-score metrics for the referrer across requested cycles
      const expectedAccurateAsOf = populatedReferrerLeaderboard.accurateAsOf;

      expect(response.responseCode).toBe(ReferrerDetailCyclesResponseCodes.Ok);
      if (response.responseCode === ReferrerDetailCyclesResponseCodes.Ok) {
        const cycle1 = response.data["2025-12"]!;
        const cycle2 = response.data["2026-03"]!;

        // Check 2025-12
        expect(cycle1.type).toBe(ReferrerDetailTypeIds.Unranked);
        expect(cycle1.rules).toEqual(populatedReferrerLeaderboard.rules);
        expect(cycle1.aggregatedMetrics).toEqual(populatedReferrerLeaderboard.aggregatedMetrics);
        expect(cycle1.referrer.referrer).toBe(nonExistingReferrer);
        expect(cycle1.referrer.rank).toBe(null);
        expect(cycle1.referrer.totalReferrals).toBe(0);
        expect(cycle1.referrer.totalIncrementalDuration).toBe(0);
        expect(cycle1.referrer.score).toBe(0);
        expect(cycle1.referrer.isQualified).toBe(false);
        expect(cycle1.referrer.finalScoreBoost).toBe(0);
        expect(cycle1.referrer.finalScore).toBe(0);
        expect(cycle1.referrer.awardPoolShare).toBe(0);
        expect(cycle1.referrer.awardPoolApproxValue).toStrictEqual({
          currency: "USDC",
          amount: 0n,
        });
        expect(cycle1.accurateAsOf).toBe(expectedAccurateAsOf);

        // Check 2026-03
        expect(cycle2.type).toBe(ReferrerDetailTypeIds.Unranked);
        expect(cycle2.referrer.referrer).toBe(nonExistingReferrer);
        expect(cycle2.referrer.rank).toBe(null);
      }
    });

    it("returns zero-score metrics for requested cycles when leaderboards are empty", async () => {
      // Arrange: mock cache map with multiple cycles, all empty
      const mockCyclesCaches = new Map<ReferralProgramCycleSlug, SWRCache<ReferrerLeaderboard>>([
        [
          "2025-12",
          {
            read: async () => emptyReferralLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
        [
          "2026-03",
          {
            read: async () => emptyReferralLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      // Mock cycle set middleware to provide a mock cycle set
      const mockCycleConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Cycle 1", rules: {} as any }],
        ["2026-03", { slug: "2026-03", displayName: "Cycle 2", rules: {} as any }],
      ]);
      vi.mocked(cycleSetMiddleware.referralProgramCycleConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramCycleConfigSet", mockCycleConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        cyclesCachesMiddleware.referralLeaderboardCyclesCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: use any referrer address
      const referrer = "0x0000000000000000000000000000000000000001";

      // Act: send test request to fetch referrer detail
      const httpResponse = await app.request(`/referrer/${referrer}?cycles=2025-12,2026-03`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailCyclesResponse(responseData);

      // Assert: response contains zero-score metrics for the referrer across requested cycles
      const expectedAccurateAsOf = emptyReferralLeaderboard.accurateAsOf;

      expect(response.responseCode).toBe(ReferrerDetailCyclesResponseCodes.Ok);
      if (response.responseCode === ReferrerDetailCyclesResponseCodes.Ok) {
        const cycle1 = response.data["2025-12"]!;
        const cycle2 = response.data["2026-03"]!;

        // Check 2025-12
        expect(cycle1.type).toBe(ReferrerDetailTypeIds.Unranked);
        expect(cycle1.rules).toEqual(emptyReferralLeaderboard.rules);
        expect(cycle1.aggregatedMetrics).toEqual(emptyReferralLeaderboard.aggregatedMetrics);
        expect(cycle1.referrer.referrer).toBe(referrer);
        expect(cycle1.referrer.rank).toBe(null);
        expect(cycle1.referrer.totalReferrals).toBe(0);
        expect(cycle1.referrer.totalIncrementalDuration).toBe(0);
        expect(cycle1.referrer.score).toBe(0);
        expect(cycle1.referrer.isQualified).toBe(false);
        expect(cycle1.referrer.finalScoreBoost).toBe(0);
        expect(cycle1.referrer.finalScore).toBe(0);
        expect(cycle1.referrer.awardPoolShare).toBe(0);
        expect(cycle1.referrer.awardPoolApproxValue).toStrictEqual({
          currency: "USDC",
          amount: 0n,
        });
        expect(cycle1.accurateAsOf).toBe(expectedAccurateAsOf);

        // Check 2026-03
        expect(cycle2.type).toBe(ReferrerDetailTypeIds.Unranked);
        expect(cycle2.referrer.referrer).toBe(referrer);
        expect(cycle2.referrer.rank).toBe(null);
      }
    });

    it("returns error response when any requested cycle cache fails to load", async () => {
      // Arrange: mock cache map where 2025-12 succeeds but 2026-03 fails
      const mockCyclesCaches = new Map<ReferralProgramCycleSlug, SWRCache<ReferrerLeaderboard>>([
        [
          "2025-12",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
        [
          "2026-03",
          {
            read: async () => new Error("Database connection failed"),
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      // Mock cycle set middleware to provide a mock cycle set
      const mockCycleConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Cycle 1", rules: {} as any }],
        ["2026-03", { slug: "2026-03", displayName: "Cycle 2", rules: {} as any }],
      ]);
      vi.mocked(cycleSetMiddleware.referralProgramCycleConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramCycleConfigSet", mockCycleConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        cyclesCachesMiddleware.referralLeaderboardCyclesCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: use any referrer address
      const referrer = "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e";

      // Act: send test request to fetch referrer detail for both cycles
      const httpResponse = await app.request(`/referrer/${referrer}?cycles=2025-12,2026-03`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailCyclesResponse(responseData);

      // Assert: response contains error mentioning the specific cycle that failed
      expect(httpResponse.status).toBe(503);
      expect(response.responseCode).toBe(ReferrerDetailCyclesResponseCodes.Error);
      if (response.responseCode === ReferrerDetailCyclesResponseCodes.Error) {
        expect(response.error).toBe("Service Unavailable");
        expect(response.errorMessage).toContain("2026-03");
        expect(response.errorMessage).toBe(
          "Referrer leaderboard data not cached for cycle(s): 2026-03",
        );
      }
    });

    it("returns error response when all requested cycle caches fail to load", async () => {
      // Arrange: mock cache map where all cycles fail
      const mockCyclesCaches = new Map<ReferralProgramCycleSlug, SWRCache<ReferrerLeaderboard>>([
        [
          "2025-12",
          {
            read: async () => new Error("Database connection failed"),
          } as SWRCache<ReferrerLeaderboard>,
        ],
        [
          "2026-03",
          {
            read: async () => new Error("Database connection failed"),
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      // Mock cycle set middleware to provide a mock cycle set
      const mockCycleConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Cycle 1", rules: {} as any }],
        ["2026-03", { slug: "2026-03", displayName: "Cycle 2", rules: {} as any }],
      ]);
      vi.mocked(cycleSetMiddleware.referralProgramCycleConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramCycleConfigSet", mockCycleConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        cyclesCachesMiddleware.referralLeaderboardCyclesCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: use any referrer address
      const referrer = "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e";

      // Act: send test request to fetch referrer detail
      const httpResponse = await app.request(`/referrer/${referrer}?cycles=2025-12,2026-03`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailCyclesResponse(responseData);

      // Assert: response contains error for all failed cycles
      expect(httpResponse.status).toBe(503);
      expect(response.responseCode).toBe(ReferrerDetailCyclesResponseCodes.Error);
      if (response.responseCode === ReferrerDetailCyclesResponseCodes.Error) {
        expect(response.error).toBe("Service Unavailable");
        expect(response.errorMessage).toContain("2025-12");
        expect(response.errorMessage).toContain("2026-03");
        expect(response.errorMessage).toBe(
          "Referrer leaderboard data not cached for cycle(s): 2025-12, 2026-03",
        );
      }
    });

    it("returns 404 error when unknown cycle slug is requested", async () => {
      // Arrange: mock cache map with configured cycles
      const mockCyclesCaches = new Map<ReferralProgramCycleSlug, SWRCache<ReferrerLeaderboard>>([
        [
          "2025-12",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
        [
          "2026-03",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      // Mock cycle set middleware to provide a mock cycle set
      const mockCycleConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Cycle 1", rules: {} as any }],
        ["2026-03", { slug: "2026-03", displayName: "Cycle 2", rules: {} as any }],
      ]);
      vi.mocked(cycleSetMiddleware.referralProgramCycleConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramCycleConfigSet", mockCycleConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        cyclesCachesMiddleware.referralLeaderboardCyclesCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: use any referrer address
      const referrer = "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e";

      // Act: send test request with one valid and one invalid cycle
      const httpResponse = await app.request(`/referrer/${referrer}?cycles=2025-12,invalid-cycle`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailCyclesResponse(responseData);

      // Assert: response is 404 error with list of valid cycles
      expect(httpResponse.status).toBe(404);
      expect(response.responseCode).toBe(ReferrerDetailCyclesResponseCodes.Error);
      if (response.responseCode === ReferrerDetailCyclesResponseCodes.Error) {
        expect(response.error).toBe("Not Found");
        expect(response.errorMessage).toContain("invalid-cycle");
        expect(response.errorMessage).toBe(
          "Unknown cycle(s): invalid-cycle. Valid cycles: 2025-12, 2026-03",
        );
      }
    });

    it("returns only requested cycle data when subset is requested", async () => {
      // Arrange: mock cache map with multiple cycles
      const mockCyclesCaches = new Map<ReferralProgramCycleSlug, SWRCache<ReferrerLeaderboard>>([
        [
          "2025-12",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
        [
          "2026-03",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
        [
          "2026-06",
          {
            read: async () => populatedReferrerLeaderboard,
          } as SWRCache<ReferrerLeaderboard>,
        ],
      ]);

      // Mock cycle set middleware to provide a mock cycle set
      const mockCycleConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Cycle 1", rules: {} as any }],
        ["2026-03", { slug: "2026-03", displayName: "Cycle 2", rules: {} as any }],
        ["2026-06", { slug: "2026-06", displayName: "Cycle 3", rules: {} as any }],
      ]);
      vi.mocked(cycleSetMiddleware.referralProgramCycleConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramCycleConfigSet", mockCycleConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        cyclesCachesMiddleware.referralLeaderboardCyclesCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", mockCyclesCaches);
        return await next();
      });

      // Arrange: use a referrer address that exists in the leaderboard
      const existingReferrer = "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e";

      // Act: send test request requesting only 2 out of 3 cycles
      const httpResponse = await app.request(
        `/referrer/${existingReferrer}?cycles=2025-12,2026-06`,
      );
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailCyclesResponse(responseData);

      // Assert: response contains only the requested cycles
      expect(response.responseCode).toBe(ReferrerDetailCyclesResponseCodes.Ok);
      if (response.responseCode === ReferrerDetailCyclesResponseCodes.Ok) {
        expect(response.data["2025-12"]).toBeDefined();
        expect(response.data["2026-06"]).toBeDefined();
        expect(response.data["2026-03"]).toBeUndefined();
      }
    });
  });

  describe("/cycles", () => {
    it("returns configured cycle config set sorted by start timestamp descending", async () => {
      // Arrange: mock cycle config set with multiple cycles
      const mockCycleConfigSet = new Map([
        [
          "2025-12",
          {
            slug: "2025-12",
            displayName: "December 2025",
            rules: buildReferralProgramRules(
              parseUsdc("10000"),
              100,
              1733011200, // 2024-12-01
              1735603200, // 2024-12-31
              { chainId: 1, address: "0x0000000000000000000000000000000000000000" },
              new URL("https://example.com/rules"),
            ),
          },
        ],
        [
          "2026-03",
          {
            slug: "2026-03",
            displayName: "March 2026",
            rules: buildReferralProgramRules(
              parseUsdc("10000"),
              100,
              1740787200, // 2025-03-01
              1743465600, // 2025-03-31
              { chainId: 1, address: "0x0000000000000000000000000000000000000000" },
              new URL("https://example.com/rules"),
            ),
          },
        ],
        [
          "2026-06",
          {
            slug: "2026-06",
            displayName: "June 2026",
            rules: buildReferralProgramRules(
              parseUsdc("10000"),
              100,
              1748736000, // 2025-06-01
              1751328000, // 2025-06-30
              { chainId: 1, address: "0x0000000000000000000000000000000000000000" },
              new URL("https://example.com/rules"),
            ),
          },
        ],
      ]);

      // Mock cycle set middleware
      vi.mocked(cycleSetMiddleware.referralProgramCycleConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramCycleConfigSet", mockCycleConfigSet);
          return await next();
        },
      );

      // Mock caches middleware (needed by middleware chain)
      vi.mocked(
        cyclesCachesMiddleware.referralLeaderboardCyclesCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", new Map());
        return await next();
      });

      // Act: send test request
      const httpResponse = await app.request("/cycles");
      const responseData = await httpResponse.json();
      const response = deserializeReferralProgramCycleConfigSetResponse(responseData);

      // Assert: response contains all cycles sorted by start timestamp descending
      expect(httpResponse.status).toBe(200);
      expect(response.responseCode).toBe(ReferralProgramCycleConfigSetResponseCodes.Ok);

      if (response.responseCode === ReferralProgramCycleConfigSetResponseCodes.Ok) {
        expect(response.data.cycles).toHaveLength(3);

        // Verify sorting: most recent start time first
        expect(response.data.cycles[0].slug).toBe("2026-06");
        expect(response.data.cycles[1].slug).toBe("2026-03");
        expect(response.data.cycles[2].slug).toBe("2025-12");

        // Verify all cycle data is present
        expect(response.data.cycles[0].displayName).toBe("June 2026");
        expect(response.data.cycles[1].displayName).toBe("March 2026");
        expect(response.data.cycles[2].displayName).toBe("December 2025");
      }
    });

    it("returns 503 error when cycle config set fails to load", async () => {
      // Arrange: mock cycle set middleware to return Error
      const loadError = new Error("Failed to fetch cycle config set");
      vi.mocked(cycleSetMiddleware.referralProgramCycleConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramCycleConfigSet", loadError);
          return await next();
        },
      );

      // Mock caches middleware (needed by middleware chain)
      vi.mocked(
        cyclesCachesMiddleware.referralLeaderboardCyclesCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardCyclesCaches", new Map());
        return await next();
      });

      // Act: send test request
      const httpResponse = await app.request("/cycles");
      const responseData = await httpResponse.json();
      const response = deserializeReferralProgramCycleConfigSetResponse(responseData);

      // Assert: response is error
      expect(httpResponse.status).toBe(503);
      expect(response.responseCode).toBe(ReferralProgramCycleConfigSetResponseCodes.Error);

      if (response.responseCode === ReferralProgramCycleConfigSetResponseCodes.Error) {
        expect(response.error).toBe("Service Unavailable");
        expect(response.errorMessage).toContain("currently unavailable");
      }
    });
  });
});
