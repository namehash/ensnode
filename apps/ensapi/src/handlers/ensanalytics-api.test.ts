// index.test.ts

import { testClient } from "hono/testing";
import { describe, expect, it, vi } from "vitest"; // Or your preferred test runner

import { ENSNamespaceIds } from "@ensnode/datasources";

import type { EnsApiConfig } from "@/config/config.schema";

import * as middleware from "../middleware/referrer-leaderboard.middleware";

vi.mock("@/config", () => ({
  get default() {
    const mockedConfig: Pick<EnsApiConfig, "ensIndexerUrl" | "namespace"> = {
      ensIndexerUrl: new URL("https://ensnode.example.com"),
      namespace: ENSNamespaceIds.Mainnet,
    };

    return mockedConfig;
  },
}));

vi.mock("../middleware/referrer-leaderboard.middleware", () => ({
  referrerLeaderboardMiddleware: vi.fn(),
}));

import pReflect from "p-reflect";

import {
  deserializeReferrerDetailResponse,
  deserializeReferrerLeaderboardPageResponse,
  ReferrerDetailResponseCodes,
  type ReferrerDetailResponseOk,
  ReferrerLeaderboardPageResponseCodes,
  type ReferrerLeaderboardPageResponseOk,
} from "@ensnode/ensnode-sdk";

import {
  emptyReferralLeaderboard,
  populatedReferrerLeaderboard,
  referrerLeaderboardPageResponseOk,
} from "@/lib/ensanalytics/referrer-leaderboard/mocks";

import app from "./ensanalytics-api";

describe("/ensanalytics", () => {
  describe("/referrers", () => {
    it("returns requested records when referrer leaderboard has multiple pages of data", async () => {
      // Arrange: set `referrerLeaderboard` context var
      vi.mocked(middleware.referrerLeaderboardMiddleware).mockImplementation(async (c, next) => {
        const mockedReferrerLeaderboard = await pReflect(
          Promise.resolve(populatedReferrerLeaderboard),
        );
        c.set("referrerLeaderboard", mockedReferrerLeaderboard);
        return await next();
      });

      // Arrange: all possible referrers on a single page response
      const allPossibleReferrers = referrerLeaderboardPageResponseOk.data.referrers;
      const allPossibleReferrersIterator = allPossibleReferrers[Symbol.iterator]();

      // Arrange: create the test client from the app instance
      const client = testClient(app);
      const itemsPerPage = 10;

      // Act: send test request to fetch 1st page
      const responsePage1 = await client.referrers
        .$get({ query: { itemsPerPage: `${itemsPerPage}`, page: "1" } }, {})
        .then((r) => r.json())
        .then(deserializeReferrerLeaderboardPageResponse);

      // Act: send test request to fetch 2nd page
      const responsePage2 = await client.referrers
        .$get({ query: { itemsPerPage: `${itemsPerPage}`, page: "2" } }, {})
        .then((r) => r.json())
        .then(deserializeReferrerLeaderboardPageResponse);

      // Act: send test request to fetch 3rd page
      const responsePage3 = await client.referrers
        .$get({ query: { itemsPerPage: `${itemsPerPage}`, page: "3" } }, {})
        .then((r) => r.json())
        .then(deserializeReferrerLeaderboardPageResponse);

      // Assert: 1st page results
      const expectedResponsePage1 = {
        responseCode: ReferrerLeaderboardPageResponseCodes.Ok,
        data: {
          ...populatedReferrerLeaderboard,
          paginationContext: {
            endIndex: 9,
            hasNext: true,
            hasPrev: false,
            itemsPerPage: 10,
            page: 1,
            startIndex: 0,
            totalPages: 3,
            totalRecords: 29,
          },
          referrers: allPossibleReferrersIterator.take(itemsPerPage).toArray(),
        },
      } satisfies ReferrerLeaderboardPageResponseOk;

      expect(responsePage1).toMatchObject(expectedResponsePage1);

      // Assert: 2nd page results
      const expectedResponsePage2 = {
        responseCode: ReferrerLeaderboardPageResponseCodes.Ok,
        data: {
          ...populatedReferrerLeaderboard,
          paginationContext: {
            endIndex: 19,
            hasNext: true,
            hasPrev: true,
            itemsPerPage: 10,
            page: 2,
            startIndex: 10,
            totalPages: 3,
            totalRecords: 29,
          },
          referrers: allPossibleReferrersIterator.take(itemsPerPage).toArray(),
        },
      } satisfies ReferrerLeaderboardPageResponseOk;
      expect(responsePage2).toMatchObject(expectedResponsePage2);

      // Assert: 3rd page results
      const expectedResponsePage3 = {
        responseCode: ReferrerLeaderboardPageResponseCodes.Ok,
        data: {
          ...populatedReferrerLeaderboard,
          paginationContext: {
            endIndex: 28,
            hasNext: false,
            hasPrev: true,
            itemsPerPage: 10,
            page: 3,
            startIndex: 20,
            totalPages: 3,
            totalRecords: 29,
          },
          referrers: allPossibleReferrersIterator.take(itemsPerPage).toArray(),
        },
      } satisfies ReferrerLeaderboardPageResponseOk;
      expect(responsePage3).toMatchObject(expectedResponsePage3);
    });

    it("returns empty cached referrer leaderboard when there are no referrals yet", async () => {
      // Arrange: set `referrerLeaderboard` context var
      vi.mocked(middleware.referrerLeaderboardMiddleware).mockImplementation(async (c, next) => {
        const mockedReferrerLeaderboard = await pReflect(Promise.resolve(emptyReferralLeaderboard));

        c.set("referrerLeaderboard", mockedReferrerLeaderboard);
        return await next();
      });

      // Arrange: create the test client from the app instance
      const client = testClient(app);
      const itemsPerPage = 10;

      // Act: send test request to fetch 1st page
      const response = await client.referrers
        .$get({ query: { itemsPerPage: `${itemsPerPage}`, page: "1" } }, {})
        .then((r) => r.json())
        .then(deserializeReferrerLeaderboardPageResponse);

      // Assert: empty page results
      const expectedResponse = {
        responseCode: ReferrerLeaderboardPageResponseCodes.Ok,
        data: {
          ...emptyReferralLeaderboard,
          paginationContext: {
            hasNext: false,
            hasPrev: false,
            itemsPerPage: 10,
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

  describe("/referrer/:referrer", () => {
    it("returns referrer metrics when referrer exists in leaderboard", async () => {
      // Arrange: set `referrerLeaderboard` context var with populated leaderboard
      vi.mocked(middleware.referrerLeaderboardMiddleware).mockImplementation(async (c, next) => {
        const mockedReferrerLeaderboard = await pReflect(
          Promise.resolve(populatedReferrerLeaderboard),
        );
        c.set("referrerLeaderboard", mockedReferrerLeaderboard);
        return await next();
      });

      // Arrange: use a referrer address that exists in the leaderboard (rank 1)
      const existingReferrer = "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e";
      const expectedMetrics = populatedReferrerLeaderboard.referrers.get(existingReferrer)!;
      const expectedAccurateAsOf = populatedReferrerLeaderboard.accurateAsOf;

      // Act: send test request to fetch referrer detail
      const httpResponse = await app.request(`/referrer/${existingReferrer}`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailResponse(responseData);

      // Assert: response contains the expected referrer metrics
      const expectedResponse = {
        responseCode: ReferrerDetailResponseCodes.Ok,
        data: {
          referrer: expectedMetrics,
          accurateAsOf: expectedAccurateAsOf,
        },
      } satisfies ReferrerDetailResponseOk;

      expect(response).toMatchObject(expectedResponse);
    });

    it("returns zero-score metrics when referrer does not exist in leaderboard", async () => {
      // Arrange: set `referrerLeaderboard` context var with populated leaderboard
      vi.mocked(middleware.referrerLeaderboardMiddleware).mockImplementation(async (c, next) => {
        const mockedReferrerLeaderboard = await pReflect(
          Promise.resolve(populatedReferrerLeaderboard),
        );
        c.set("referrerLeaderboard", mockedReferrerLeaderboard);
        return await next();
      });

      // Arrange: use a referrer address that does NOT exist in the leaderboard
      const nonExistingReferrer = "0x0000000000000000000000000000000000000099";

      // Act: send test request to fetch referrer detail
      const httpResponse = await app.request(`/referrer/${nonExistingReferrer}`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailResponse(responseData);

      // Assert: response contains zero-score metrics for the referrer
      // Rank should be null since they're not on the leaderboard
      const expectedAccurateAsOf = populatedReferrerLeaderboard.accurateAsOf;

      expect(response.responseCode).toBe(ReferrerDetailResponseCodes.Ok);
      if (response.responseCode === ReferrerDetailResponseCodes.Ok) {
        expect(response.data.referrer.referrer).toBe(nonExistingReferrer);
        expect(response.data.referrer.rank).toBe(null);
        expect(response.data.referrer.totalReferrals).toBe(0);
        expect(response.data.referrer.totalIncrementalDuration).toBe(0);
        expect(response.data.referrer.score).toBe(0);
        expect(response.data.referrer.isQualified).toBe(false);
        expect(response.data.referrer.finalScoreBoost).toBe(0);
        expect(response.data.referrer.finalScore).toBe(0);
        expect(response.data.referrer.awardPoolShare).toBe(0);
        expect(response.data.referrer.awardPoolApproxValue).toBe(0);
        expect(response.data.accurateAsOf).toBe(expectedAccurateAsOf);
      }
    });

    it("returns zero-score metrics when leaderboard is empty", async () => {
      // Arrange: set `referrerLeaderboard` context var with empty leaderboard
      vi.mocked(middleware.referrerLeaderboardMiddleware).mockImplementation(async (c, next) => {
        const mockedReferrerLeaderboard = await pReflect(Promise.resolve(emptyReferralLeaderboard));
        c.set("referrerLeaderboard", mockedReferrerLeaderboard);
        return await next();
      });

      // Arrange: use any referrer address
      const referrer = "0x0000000000000000000000000000000000000001";

      // Act: send test request to fetch referrer detail
      const httpResponse = await app.request(`/referrer/${referrer}`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailResponse(responseData);

      // Assert: response contains zero-score metrics for the referrer
      // Rank should be null since they're not on the leaderboard
      const expectedAccurateAsOf = emptyReferralLeaderboard.accurateAsOf;

      expect(response.responseCode).toBe(ReferrerDetailResponseCodes.Ok);
      if (response.responseCode === ReferrerDetailResponseCodes.Ok) {
        expect(response.data.referrer.referrer).toBe(referrer);
        expect(response.data.referrer.rank).toBe(null);
        expect(response.data.referrer.totalReferrals).toBe(0);
        expect(response.data.referrer.totalIncrementalDuration).toBe(0);
        expect(response.data.referrer.score).toBe(0);
        expect(response.data.referrer.isQualified).toBe(false);
        expect(response.data.referrer.finalScoreBoost).toBe(0);
        expect(response.data.referrer.finalScore).toBe(0);
        expect(response.data.referrer.awardPoolShare).toBe(0);
        expect(response.data.referrer.awardPoolApproxValue).toBe(0);
        expect(response.data.accurateAsOf).toBe(expectedAccurateAsOf);
      }
    });

    it("returns error response when leaderboard fails to load", async () => {
      // Arrange: set `referrerLeaderboard` context var with rejected promise
      vi.mocked(middleware.referrerLeaderboardMiddleware).mockImplementation(async (c, next) => {
        const mockedReferrerLeaderboard = await pReflect(
          Promise.reject(new Error("Database connection failed")),
        );
        c.set("referrerLeaderboard", mockedReferrerLeaderboard);
        return await next();
      });

      // Arrange: use any referrer address
      const referrer = "0x538e35b2888ed5bc58cf2825d76cf6265aa4e31e";

      // Act: send test request to fetch referrer detail
      const httpResponse = await app.request(`/referrer/${referrer}`);
      const responseData = await httpResponse.json();
      const response = deserializeReferrerDetailResponse(responseData);

      // Assert: response contains error
      expect(response.responseCode).toBe(ReferrerDetailResponseCodes.Error);
      if (response.responseCode === ReferrerDetailResponseCodes.Error) {
        expect(response.error).toBe("Internal Server Error");
        expect(response.errorMessage).toBe("Failed to load referrer leaderboard data.");
      }
    });
  });
});
