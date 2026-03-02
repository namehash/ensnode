import { describe, expect, it, vi } from "vitest";

import { ENSNamespaceIds } from "@ensnode/datasources";

import type { EnsApiConfig } from "@/config/config.schema";

import * as editionsCachesMiddleware from "../middleware/referral-leaderboard-editions-caches.middleware";
import * as editionSetMiddleware from "../middleware/referral-program-edition-set.middleware";

vi.mock("@/config", () => ({
  get default() {
    const mockedConfig: Pick<EnsApiConfig, "ensIndexerUrl" | "namespace"> = {
      ensIndexerUrl: new URL("https://ensnode.example.com"),
      namespace: ENSNamespaceIds.Mainnet,
    };

    return mockedConfig;
  },
}));

vi.mock("../middleware/referral-program-edition-set.middleware", () => ({
  referralProgramEditionConfigSetMiddleware: vi.fn(),
}));

vi.mock("../middleware/referral-leaderboard-editions-caches.middleware", () => ({
  referralLeaderboardEditionsCachesMiddleware: vi.fn(),
}));

import {
  buildReferralProgramRules,
  deserializeReferralProgramEditionConfigSetResponse,
  deserializeReferrerLeaderboardPageResponse,
  deserializeReferrerMetricsEditionsResponse,
  ReferralProgramEditionConfigSetResponseCodes,
  type ReferralProgramEditionSlug,
  ReferralProgramStatuses,
  ReferrerEditionMetricsTypeIds,
  type ReferrerLeaderboard,
  ReferrerLeaderboardPageResponseCodes,
  type ReferrerLeaderboardPageResponseOk,
  ReferrerMetricsEditionsResponseCodes,
  type ReferrerMetricsEditionsResponseOk,
} from "@namehash/ens-referrals/v1";

import { parseTimestamp, parseUsdc, type SWRCache } from "@ensnode/ensnode-sdk";

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
      const mockEditionsCaches = new Map<ReferralProgramEditionSlug, SWRCache<ReferrerLeaderboard>>(
        [
          [
            "2025-12",
            {
              read: async () => populatedReferrerLeaderboard,
            } as SWRCache<ReferrerLeaderboard>,
          ],
        ],
      );

      // Mock edition set middleware to provide a mock edition set
      const mockEditionConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Edition 1", rules: {} as any }],
      ]);
      vi.mocked(editionSetMiddleware.referralProgramEditionConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramEditionConfigSet", mockEditionConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        editionsCachesMiddleware.referralLeaderboardEditionsCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardEditionsCaches", mockEditionsCaches);
        return await next();
      });

      // Arrange: all possible referrers on a single page response
      const allPossibleReferrers = referrerLeaderboardPageResponseOk.data.referrers;
      const allPossibleReferrersIterator = allPossibleReferrers[Symbol.iterator]();

      const recordsPerPage = 10;
      const edition = "2025-12";

      // Act: send test request to fetch 1st page
      const httpResponsePage1 = await app.request(
        `/referral-leaderboard?edition=${edition}&recordsPerPage=${recordsPerPage}&page=1`,
      );
      const responsePage1 = deserializeReferrerLeaderboardPageResponse(
        await httpResponsePage1.json(),
      );

      // Act: send test request to fetch 2nd page
      const httpResponsePage2 = await app.request(
        `/referral-leaderboard?edition=${edition}&recordsPerPage=${recordsPerPage}&page=2`,
      );
      const responsePage2 = deserializeReferrerLeaderboardPageResponse(
        await httpResponsePage2.json(),
      );

      // Act: send test request to fetch 3rd page
      const httpResponsePage3 = await app.request(
        `/referral-leaderboard?edition=${edition}&recordsPerPage=${recordsPerPage}&page=3`,
      );
      const responsePage3 = deserializeReferrerLeaderboardPageResponse(
        await httpResponsePage3.json(),
      );

      // Assert: 1st page results
      const expectedResponsePage1 = {
        responseCode: ReferrerLeaderboardPageResponseCodes.Ok,
        data: {
          ...populatedReferrerLeaderboard,
          status: ReferralProgramStatuses.Active,
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
          status: ReferralProgramStatuses.Active,
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
          status: ReferralProgramStatuses.Active,
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
      const mockEditionsCaches = new Map<ReferralProgramEditionSlug, SWRCache<ReferrerLeaderboard>>(
        [
          [
            "2025-12",
            {
              read: async () => emptyReferralLeaderboard,
            } as SWRCache<ReferrerLeaderboard>,
          ],
        ],
      );

      // Mock edition set middleware to provide a mock edition set
      const mockEditionConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Edition 1", rules: {} as any }],
      ]);
      vi.mocked(editionSetMiddleware.referralProgramEditionConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramEditionConfigSet", mockEditionConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        editionsCachesMiddleware.referralLeaderboardEditionsCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardEditionsCaches", mockEditionsCaches);
        return await next();
      });

      const recordsPerPage = 10;
      const edition = "2025-12";

      // Act: send test request to fetch 1st page
      const httpResponse = await app.request(
        `/referral-leaderboard?edition=${edition}&recordsPerPage=${recordsPerPage}&page=1`,
      );
      const response = deserializeReferrerLeaderboardPageResponse(await httpResponse.json());

      // Assert: empty page results
      const expectedResponse = {
        responseCode: ReferrerLeaderboardPageResponseCodes.Ok,
        data: {
          ...emptyReferralLeaderboard,
          status: ReferralProgramStatuses.Active,
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

    it("returns 404 error when unknown edition slug is requested", async () => {
      // Arrange: mock cache map with test-edition-a and test-edition-b
      const mockEditionsCaches = new Map<ReferralProgramEditionSlug, SWRCache<ReferrerLeaderboard>>(
        [
          [
            "test-edition-a",
            {
              read: async () => populatedReferrerLeaderboard,
            } as SWRCache<ReferrerLeaderboard>,
          ],
          [
            "test-edition-b",
            {
              read: async () => populatedReferrerLeaderboard,
            } as SWRCache<ReferrerLeaderboard>,
          ],
        ],
      );

      // Mock edition set middleware to provide a mock edition set
      const mockEditionConfigSet = new Map([
        ["test-edition-a", { slug: "test-edition-a", displayName: "Edition A", rules: {} as any }],
        ["test-edition-b", { slug: "test-edition-b", displayName: "Edition B", rules: {} as any }],
      ]);
      vi.mocked(editionSetMiddleware.referralProgramEditionConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramEditionConfigSet", mockEditionConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        editionsCachesMiddleware.referralLeaderboardEditionsCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardEditionsCaches", mockEditionsCaches);
        return await next();
      });

      const recordsPerPage = 10;
      const invalidEdition = "invalid-edition";

      // Act: send test request with invalid edition slug
      const httpResponse = await app.request(
        `/referral-leaderboard?edition=${invalidEdition}&recordsPerPage=${recordsPerPage}&page=1`,
      );
      const responseData = await httpResponse.json();
      const response = deserializeReferrerLeaderboardPageResponse(responseData);

      // Assert: response is 404 error with list of valid editions from config
      expect(httpResponse.status).toBe(404);
      expect(response.responseCode).toBe(ReferrerLeaderboardPageResponseCodes.Error);
      if (response.responseCode === ReferrerLeaderboardPageResponseCodes.Error) {
        expect(response.error).toBe("Not Found");
        expect(response.errorMessage).toBe(
          "Unknown edition: invalid-edition. Valid editions: test-edition-a, test-edition-b",
        );
      }
    });
  });

  describe("/referrer/:referrer", () => {
    it("returns referrer metrics for requested editions when referrer exists", async () => {
      // Arrange: mock cache map with multiple editions
      const mockEditionsCaches = new Map<ReferralProgramEditionSlug, SWRCache<ReferrerLeaderboard>>(
        [
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
        ],
      );

      // Mock edition set middleware to provide a mock edition set
      const mockEditionConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Edition 1", rules: {} as any }],
        ["2026-03", { slug: "2026-03", displayName: "Edition 2", rules: {} as any }],
      ]);
      vi.mocked(editionSetMiddleware.referralProgramEditionConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramEditionConfigSet", mockEditionConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        editionsCachesMiddleware.referralLeaderboardEditionsCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardEditionsCaches", mockEditionsCaches);
        return await next();
      });

      // Arrange: use a referrer address that exists in the leaderboard (rank 1)
      const existingReferrer = "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e";
      const expectedMetrics = populatedReferrerLeaderboard.referrers.get(existingReferrer)!;
      const expectedAccurateAsOf = populatedReferrerLeaderboard.accurateAsOf;

      // Act: send test request to fetch referrer detail for requested editions
      const httpResponse = await app.request(
        `/referrer/${existingReferrer}?editions=2025-12,2026-03`,
      );
      const responseData = await httpResponse.json();
      const response = deserializeReferrerMetricsEditionsResponse(responseData);

      // Assert: response contains the expected referrer metrics for requested editions
      const expectedResponse = {
        responseCode: ReferrerMetricsEditionsResponseCodes.Ok,
        data: {
          "2025-12": {
            type: ReferrerEditionMetricsTypeIds.Ranked,
            rules: populatedReferrerLeaderboard.rules,
            referrer: expectedMetrics,
            aggregatedMetrics: populatedReferrerLeaderboard.aggregatedMetrics,
            accurateAsOf: expectedAccurateAsOf,
            status: ReferralProgramStatuses.Active,
          },
          "2026-03": {
            type: ReferrerEditionMetricsTypeIds.Ranked,
            rules: populatedReferrerLeaderboard.rules,
            referrer: expectedMetrics,
            aggregatedMetrics: populatedReferrerLeaderboard.aggregatedMetrics,
            accurateAsOf: expectedAccurateAsOf,
            status: ReferralProgramStatuses.Active,
          },
        },
      } satisfies ReferrerMetricsEditionsResponseOk;

      expect(response).toMatchObject(expectedResponse);
    });

    it("returns zero-score metrics for requested editions when referrer does not exist", async () => {
      // Arrange: mock cache map with multiple editions
      const mockEditionsCaches = new Map<ReferralProgramEditionSlug, SWRCache<ReferrerLeaderboard>>(
        [
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
        ],
      );

      // Mock edition set middleware to provide a mock edition set
      const mockEditionConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Edition 1", rules: {} as any }],
        ["2026-03", { slug: "2026-03", displayName: "Edition 2", rules: {} as any }],
      ]);
      vi.mocked(editionSetMiddleware.referralProgramEditionConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramEditionConfigSet", mockEditionConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        editionsCachesMiddleware.referralLeaderboardEditionsCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardEditionsCaches", mockEditionsCaches);
        return await next();
      });

      // Arrange: use a referrer address that does NOT exist in the leaderboard
      const nonExistingReferrer = "0x0000000000000000000000000000000000000099";

      // Act: send test request to fetch referrer detail
      const httpResponse = await app.request(
        `/referrer/${nonExistingReferrer}?editions=2025-12,2026-03`,
      );
      const responseData = await httpResponse.json();
      const response = deserializeReferrerMetricsEditionsResponse(responseData);

      // Assert: response contains zero-score metrics for the referrer across requested editions
      const expectedAccurateAsOf = populatedReferrerLeaderboard.accurateAsOf;

      expect(response.responseCode).toBe(ReferrerMetricsEditionsResponseCodes.Ok);
      if (response.responseCode === ReferrerMetricsEditionsResponseCodes.Ok) {
        const edition1 = response.data["2025-12"]!;
        const edition2 = response.data["2026-03"]!;

        // Check 2025-12
        expect(edition1.type).toBe(ReferrerEditionMetricsTypeIds.Unranked);
        expect(edition1.rules).toEqual(populatedReferrerLeaderboard.rules);
        expect(edition1.aggregatedMetrics).toEqual(populatedReferrerLeaderboard.aggregatedMetrics);
        expect(edition1.referrer.referrer).toBe(nonExistingReferrer);
        expect(edition1.referrer.rank).toBe(null);
        expect(edition1.referrer.totalReferrals).toBe(0);
        expect(edition1.referrer.totalIncrementalDuration).toBe(0);
        expect(edition1.referrer.score).toBe(0);
        expect(edition1.referrer.isQualified).toBe(false);
        expect(edition1.referrer.finalScoreBoost).toBe(0);
        expect(edition1.referrer.finalScore).toBe(0);
        expect(edition1.referrer.awardPoolShare).toBe(0);
        expect(edition1.referrer.awardPoolApproxValue).toStrictEqual({
          currency: "USDC",
          amount: 0n,
        });
        expect(edition1.accurateAsOf).toBe(expectedAccurateAsOf);

        // Check 2026-03
        expect(edition2.type).toBe(ReferrerEditionMetricsTypeIds.Unranked);
        expect(edition2.referrer.referrer).toBe(nonExistingReferrer);
        expect(edition2.referrer.rank).toBe(null);
      }
    });

    it("returns zero-score metrics for requested editions when leaderboards are empty", async () => {
      // Arrange: mock cache map with multiple editions, all empty
      const mockEditionsCaches = new Map<ReferralProgramEditionSlug, SWRCache<ReferrerLeaderboard>>(
        [
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
        ],
      );

      // Mock edition set middleware to provide a mock edition set
      const mockEditionConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Edition 1", rules: {} as any }],
        ["2026-03", { slug: "2026-03", displayName: "Edition 2", rules: {} as any }],
      ]);
      vi.mocked(editionSetMiddleware.referralProgramEditionConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramEditionConfigSet", mockEditionConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        editionsCachesMiddleware.referralLeaderboardEditionsCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardEditionsCaches", mockEditionsCaches);
        return await next();
      });

      // Arrange: use any referrer address
      const referrer = "0x0000000000000000000000000000000000000001";

      // Act: send test request to fetch referrer detail
      const httpResponse = await app.request(`/referrer/${referrer}?editions=2025-12,2026-03`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerMetricsEditionsResponse(responseData);

      // Assert: response contains zero-score metrics for the referrer across requested editions
      const expectedAccurateAsOf = emptyReferralLeaderboard.accurateAsOf;

      expect(response.responseCode).toBe(ReferrerMetricsEditionsResponseCodes.Ok);
      if (response.responseCode === ReferrerMetricsEditionsResponseCodes.Ok) {
        const edition1 = response.data["2025-12"]!;
        const edition2 = response.data["2026-03"]!;

        // Check 2025-12
        expect(edition1.type).toBe(ReferrerEditionMetricsTypeIds.Unranked);
        expect(edition1.rules).toEqual(emptyReferralLeaderboard.rules);
        expect(edition1.aggregatedMetrics).toEqual(emptyReferralLeaderboard.aggregatedMetrics);
        expect(edition1.referrer.referrer).toBe(referrer);
        expect(edition1.referrer.rank).toBe(null);
        expect(edition1.referrer.totalReferrals).toBe(0);
        expect(edition1.referrer.totalIncrementalDuration).toBe(0);
        expect(edition1.referrer.score).toBe(0);
        expect(edition1.referrer.isQualified).toBe(false);
        expect(edition1.referrer.finalScoreBoost).toBe(0);
        expect(edition1.referrer.finalScore).toBe(0);
        expect(edition1.referrer.awardPoolShare).toBe(0);
        expect(edition1.referrer.awardPoolApproxValue).toStrictEqual({
          currency: "USDC",
          amount: 0n,
        });
        expect(edition1.accurateAsOf).toBe(expectedAccurateAsOf);

        // Check 2026-03
        expect(edition2.type).toBe(ReferrerEditionMetricsTypeIds.Unranked);
        expect(edition2.referrer.referrer).toBe(referrer);
        expect(edition2.referrer.rank).toBe(null);
      }
    });

    it("returns error response when any requested edition cache fails to load", async () => {
      // Arrange: mock cache map where 2025-12 succeeds but 2026-03 fails
      const mockEditionsCaches = new Map<ReferralProgramEditionSlug, SWRCache<ReferrerLeaderboard>>(
        [
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
        ],
      );

      // Mock edition set middleware to provide a mock edition set
      const mockEditionConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Edition 1", rules: {} as any }],
        ["2026-03", { slug: "2026-03", displayName: "Edition 2", rules: {} as any }],
      ]);
      vi.mocked(editionSetMiddleware.referralProgramEditionConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramEditionConfigSet", mockEditionConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        editionsCachesMiddleware.referralLeaderboardEditionsCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardEditionsCaches", mockEditionsCaches);
        return await next();
      });

      // Arrange: use any referrer address
      const referrer = "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e";

      // Act: send test request to fetch referrer detail for both editions
      const httpResponse = await app.request(`/referrer/${referrer}?editions=2025-12,2026-03`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerMetricsEditionsResponse(responseData);

      // Assert: response contains error mentioning the specific edition that failed
      expect(httpResponse.status).toBe(503);
      expect(response.responseCode).toBe(ReferrerMetricsEditionsResponseCodes.Error);
      if (response.responseCode === ReferrerMetricsEditionsResponseCodes.Error) {
        expect(response.error).toBe("Service Unavailable");
        expect(response.errorMessage).toContain("2026-03");
        expect(response.errorMessage).toBe(
          "Referrer leaderboard data not cached for edition(s): 2026-03",
        );
      }
    });

    it("returns error response when all requested edition caches fail to load", async () => {
      // Arrange: mock cache map where all editions fail
      const mockEditionsCaches = new Map<ReferralProgramEditionSlug, SWRCache<ReferrerLeaderboard>>(
        [
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
        ],
      );

      // Mock edition set middleware to provide a mock edition set
      const mockEditionConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Edition 1", rules: {} as any }],
        ["2026-03", { slug: "2026-03", displayName: "Edition 2", rules: {} as any }],
      ]);
      vi.mocked(editionSetMiddleware.referralProgramEditionConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramEditionConfigSet", mockEditionConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        editionsCachesMiddleware.referralLeaderboardEditionsCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardEditionsCaches", mockEditionsCaches);
        return await next();
      });

      // Arrange: use any referrer address
      const referrer = "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e";

      // Act: send test request to fetch referrer detail
      const httpResponse = await app.request(`/referrer/${referrer}?editions=2025-12,2026-03`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerMetricsEditionsResponse(responseData);

      // Assert: response contains error for all failed editions
      expect(httpResponse.status).toBe(503);
      expect(response.responseCode).toBe(ReferrerMetricsEditionsResponseCodes.Error);
      if (response.responseCode === ReferrerMetricsEditionsResponseCodes.Error) {
        expect(response.error).toBe("Service Unavailable");
        expect(response.errorMessage).toContain("2025-12");
        expect(response.errorMessage).toContain("2026-03");
        expect(response.errorMessage).toBe(
          "Referrer leaderboard data not cached for edition(s): 2025-12, 2026-03",
        );
      }
    });

    it("returns 404 error when unknown edition slug is requested", async () => {
      // Arrange: mock cache map with configured editions
      const mockEditionsCaches = new Map<ReferralProgramEditionSlug, SWRCache<ReferrerLeaderboard>>(
        [
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
        ],
      );

      // Mock edition set middleware to provide a mock edition set
      const mockEditionConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Edition 1", rules: {} as any }],
        ["2026-03", { slug: "2026-03", displayName: "Edition 2", rules: {} as any }],
      ]);
      vi.mocked(editionSetMiddleware.referralProgramEditionConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramEditionConfigSet", mockEditionConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        editionsCachesMiddleware.referralLeaderboardEditionsCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardEditionsCaches", mockEditionsCaches);
        return await next();
      });

      // Arrange: use any referrer address
      const referrer = "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e";

      // Act: send test request with one valid and one invalid edition
      const httpResponse = await app.request(
        `/referrer/${referrer}?editions=2025-12,invalid-edition`,
      );
      const responseData = await httpResponse.json();
      const response = deserializeReferrerMetricsEditionsResponse(responseData);

      // Assert: response is 404 error with list of valid editions
      expect(httpResponse.status).toBe(404);
      expect(response.responseCode).toBe(ReferrerMetricsEditionsResponseCodes.Error);
      if (response.responseCode === ReferrerMetricsEditionsResponseCodes.Error) {
        expect(response.error).toBe("Not Found");
        expect(response.errorMessage).toContain("invalid-edition");
        expect(response.errorMessage).toBe(
          "Unknown edition(s): invalid-edition. Valid editions: 2025-12, 2026-03",
        );
      }
    });

    it("returns only requested edition data when subset is requested", async () => {
      // Arrange: mock cache map with multiple editions
      const mockEditionsCaches = new Map<ReferralProgramEditionSlug, SWRCache<ReferrerLeaderboard>>(
        [
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
        ],
      );

      // Mock edition set middleware to provide a mock edition set
      const mockEditionConfigSet = new Map([
        ["2025-12", { slug: "2025-12", displayName: "Edition 1", rules: {} as any }],
        ["2026-03", { slug: "2026-03", displayName: "Edition 2", rules: {} as any }],
        ["2026-06", { slug: "2026-06", displayName: "Edition 3", rules: {} as any }],
      ]);
      vi.mocked(editionSetMiddleware.referralProgramEditionConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramEditionConfigSet", mockEditionConfigSet);
          return await next();
        },
      );

      // Mock caches middleware to provide the mock caches
      vi.mocked(
        editionsCachesMiddleware.referralLeaderboardEditionsCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardEditionsCaches", mockEditionsCaches);
        return await next();
      });

      // Arrange: use a referrer address that exists in the leaderboard
      const existingReferrer = "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e";

      // Act: send test request requesting only 2 out of 3 editions
      const httpResponse = await app.request(
        `/referrer/${existingReferrer}?editions=2025-12,2026-06`,
      );
      const responseData = await httpResponse.json();
      const response = deserializeReferrerMetricsEditionsResponse(responseData);

      // Assert: response contains only the requested editions
      expect(response.responseCode).toBe(ReferrerMetricsEditionsResponseCodes.Ok);
      if (response.responseCode === ReferrerMetricsEditionsResponseCodes.Ok) {
        expect(response.data["2025-12"]).toBeDefined();
        expect(response.data["2026-06"]).toBeDefined();
        expect(response.data["2026-03"]).toBeUndefined();
      }
    });
  });

  describe("/editions", () => {
    it("returns configured edition config set sorted by start timestamp descending", async () => {
      // Arrange: mock edition config set with multiple editions
      const mockEditionConfigSet = new Map([
        [
          "2025-12",
          {
            slug: "2025-12",
            displayName: "December 2025",
            rules: buildReferralProgramRules(
              parseUsdc("10000"),
              100,
              parseTimestamp("2025-12-01T00:00:00Z"),
              parseTimestamp("2025-12-31T23:59:59Z"),
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
              parseTimestamp("2026-03-01T00:00:00Z"),
              parseTimestamp("2026-03-31T23:59:59Z"),
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
              parseTimestamp("2026-06-01T00:00:00Z"),
              parseTimestamp("2026-06-30T23:59:59Z"),
              { chainId: 1, address: "0x0000000000000000000000000000000000000000" },
              new URL("https://example.com/rules"),
            ),
          },
        ],
      ]);

      // Mock edition set middleware
      vi.mocked(editionSetMiddleware.referralProgramEditionConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramEditionConfigSet", mockEditionConfigSet);
          return await next();
        },
      );

      // Mock caches middleware (needed by middleware chain)
      vi.mocked(
        editionsCachesMiddleware.referralLeaderboardEditionsCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardEditionsCaches", new Map());
        return await next();
      });

      // Act: send test request
      const httpResponse = await app.request("/editions");
      const responseData = await httpResponse.json();
      const response = deserializeReferralProgramEditionConfigSetResponse(responseData);

      // Assert: response contains all editions sorted by start timestamp descending
      expect(httpResponse.status).toBe(200);
      expect(response.responseCode).toBe(ReferralProgramEditionConfigSetResponseCodes.Ok);

      if (response.responseCode === ReferralProgramEditionConfigSetResponseCodes.Ok) {
        expect(response.data.editions).toHaveLength(3);

        // Verify sorting: most recent start time first
        expect(response.data.editions[0].slug).toBe("2026-06");
        expect(response.data.editions[1].slug).toBe("2026-03");
        expect(response.data.editions[2].slug).toBe("2025-12");

        // Verify all edition data is present
        expect(response.data.editions[0].displayName).toBe("June 2026");
        expect(response.data.editions[1].displayName).toBe("March 2026");
        expect(response.data.editions[2].displayName).toBe("December 2025");
      }
    });

    it("returns 503 error when edition config set fails to load", async () => {
      // Arrange: mock edition set middleware to return Error
      const loadError = new Error("Failed to fetch edition config set");
      vi.mocked(editionSetMiddleware.referralProgramEditionConfigSetMiddleware).mockImplementation(
        async (c, next) => {
          c.set("referralProgramEditionConfigSet", loadError);
          return await next();
        },
      );

      // Mock caches middleware (needed by middleware chain even though /editions doesn't use it)
      vi.mocked(
        editionsCachesMiddleware.referralLeaderboardEditionsCachesMiddleware,
      ).mockImplementation(async (c, next) => {
        c.set("referralLeaderboardEditionsCaches", new Map());
        return await next();
      });

      // Act: send test request
      const httpResponse = await app.request("/editions");
      const responseData = await httpResponse.json();
      const response = deserializeReferralProgramEditionConfigSetResponse(responseData);

      // Assert: response is error
      expect(httpResponse.status).toBe(503);
      expect(response.responseCode).toBe(ReferralProgramEditionConfigSetResponseCodes.Error);

      if (response.responseCode === ReferralProgramEditionConfigSetResponseCodes.Error) {
        expect(response.error).toBe("Service Unavailable");
        expect(response.errorMessage).toContain("currently unavailable");
      }
    });
  });
});
