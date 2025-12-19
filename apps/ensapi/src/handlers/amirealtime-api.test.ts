import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type CrossChainIndexingStatusSnapshot,
  createRealtimeIndexingStatusProjection,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import * as middleware from "@/middleware/indexing-status.middleware";

import amIRealtimeApi, { AMIREALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE } from "./amirealtime-api"; // adjust import path as needed

vi.mock("@/middleware/indexing-status.middleware", () => ({
  indexingStatusMiddleware: vi.fn(),
}));

const indexingStatusMiddlewareMock = vi.mocked(middleware.indexingStatusMiddleware);

describe("amirealtime-api", () => {
  const now: UnixTimestamp = 1766123729;

  const arrangeMockedIndexingStatusMiddleware = ({
    now,
    slowestChainIndexingCursor,
  }: {
    now: UnixTimestamp;
    slowestChainIndexingCursor?: UnixTimestamp;
  }) => {
    indexingStatusMiddlewareMock.mockImplementation(async (c, next) => {
      const indexingStatus = {
        slowestChainIndexingCursor: slowestChainIndexingCursor ?? now - 10,
        snapshotTime: now,
      } satisfies Pick<
        CrossChainIndexingStatusSnapshot,
        "slowestChainIndexingCursor" | "snapshotTime"
      > as CrossChainIndexingStatusSnapshot;

      const realtimeProjection = createRealtimeIndexingStatusProjection(indexingStatus, now);

      c.set("indexingStatus", realtimeProjection);

      return await next();
    });
  };

  let app: ReturnType<typeof factory.createApp>;

  beforeEach(() => {
    // Create a fresh app instance for each test with middleware registered
    app = factory.createApp();
    app.use(middleware.indexingStatusMiddleware);
    app.route("/amirealtime", amIRealtimeApi);
  });

  afterEach(() => {
    indexingStatusMiddlewareMock.mockReset();
  });

  describe("GET /amirealtime", () => {
    describe("request", () => {
      it("should accept valid maxWorstCaseDistance query param", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxWorstCaseDistance=300");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toMatchObject({
          maxWorstCaseDistance: 300,
        });
      });

      it("should accept valid maxWorstCaseDistance query param (set to `0`)", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxWorstCaseDistance=0");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toMatchObject({
          maxWorstCaseDistance: 0,
        });
      });

      it("should use default maxWorstCaseDistance when unset", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxWorstCaseDistance");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toMatchObject({
          maxWorstCaseDistance: AMIREALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE,
        });
      });

      it("should use default maxWorstCaseDistance when not provided", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now });

        // Act
        const response = await app.request("http://localhost/amirealtime");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toMatchObject({
          maxWorstCaseDistance: AMIREALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE,
        });
      });

      it("should reject invalid maxWorstCaseDistance (negative number)", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxWorstCaseDistance=-1");

        // Assert
        expect(response.status).toBe(400);
        await expect(response.text()).resolves.toMatch(
          /maxWorstCaseDistance query param must be a non-negative integer/,
        );
      });

      it("should reject invalid maxWorstCaseDistance (not a number)", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now });

        // Act
        const response = await app.request(
          "http://localhost/amirealtime?maxWorstCaseDistance=invalid",
        );

        // Assert
        expect(response.status).toBe(400);
        await expect(response.text()).resolves.toMatch(
          /maxWorstCaseDistance query param must be a number/,
        );
      });
    });

    describe("response", () => {
      it("should return 200 when worstCaseDistance is below maxWorstCaseDistance", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now - 9 });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxWorstCaseDistance=10");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toMatchObject({
          maxWorstCaseDistance: 10,
          slowestChainIndexingCursor: 1766123720,
          worstCaseDistance: 9,
        });
      });

      it("should return 200 when worstCaseDistance equals maxWorstCaseDistance", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now - 10 });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxWorstCaseDistance=10");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toMatchObject({
          maxWorstCaseDistance: 10,
          slowestChainIndexingCursor: 1766123719,
          worstCaseDistance: 10,
        });
      });

      it("should return 503 when worstCaseDistance exceeds maxWorstCaseDistance", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now - 11 });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxWorstCaseDistance=10");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(503);
        expect(responseJson).toHaveProperty("message");
        expect(responseJson.message).toMatch(
          /Indexing Status 'worstCaseDistance' must be below or equal to the requested 'maxWorstCaseDistance'; worstCaseDistance = 11; maxWorstCaseDistance = 10/,
        );
      });

      it("should return 500 when indexing status has not been resolved", async () => {
        // Arrange: set `indexingStatus` context var
        indexingStatusMiddlewareMock.mockImplementation(async (c, next) => {
          c.set("indexingStatus", new Error("Network error"));

          return await next();
        });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxWorstCaseDistance=10");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(503);
        expect(responseJson).toHaveProperty("message");
        expect(responseJson.message).toMatch(
          /Indexing Status has to be resolved successfully before 'maxWorstCaseDistance' can be applied./,
        );
      });
    });
  });
});
