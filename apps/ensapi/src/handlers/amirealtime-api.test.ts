import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type CrossChainIndexingStatusSnapshot,
  createRealtimeIndexingStatusProjection,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";

import { factory } from "@/lib/hono-factory";
import * as middleware from "@/middleware/indexing-status.middleware";

import amIRealtimeApi, { AMIREALTIME_DEFAULT_MAX_REALTIME_DISTANCE } from "./amirealtime-api"; // adjust import path as needed

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
      it("should accept valid maxRealtimeDistance query param", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxRealtimeDistance=300");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toMatchObject({
          maxRealtimeDistance: 300,
        });
      });

      it("should accept valid maxRealtimeDistance query param (set to `0`)", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxRealtimeDistance=0");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toMatchObject({
          maxRealtimeDistance: 0,
        });
      });

      it("should use default maxRealtimeDistance when unset", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxRealtimeDistance");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toMatchObject({
          maxRealtimeDistance: AMIREALTIME_DEFAULT_MAX_REALTIME_DISTANCE,
        });
      });

      it("should use default maxRealtimeDistance when not provided", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now });

        // Act
        const response = await app.request("http://localhost/amirealtime");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toMatchObject({
          maxRealtimeDistance: AMIREALTIME_DEFAULT_MAX_REALTIME_DISTANCE,
        });
      });

      it("should reject invalid maxRealtimeDistance (negative number)", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxRealtimeDistance=-1");

        // Assert
        expect(response.status).toBe(400);
        await expect(response.text()).resolves.toMatch(
          /maxRealtimeDistance query param must be a non-negative integer/,
        );
      });

      it("should reject invalid maxRealtimeDistance (not a number)", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now });

        // Act
        const response = await app.request(
          "http://localhost/amirealtime?maxRealtimeDistance=invalid",
        );

        // Assert
        expect(response.status).toBe(400);
        await expect(response.text()).resolves.toMatch(
          /maxRealtimeDistance query param must be a number/,
        );
      });
    });

    describe("response", () => {
      it("should return 200 when worstCaseDistance is below maxRealtimeDistance", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now - 9 });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxRealtimeDistance=10");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toMatchObject({
          maxRealtimeDistance: 10,
          slowestChainIndexingCursor: 1766123720,
          worstCaseDistance: 9,
        });
      });

      it("should return 200 when worstCaseDistance equals maxRealtimeDistance", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now - 10 });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxRealtimeDistance=10");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toMatchObject({
          maxRealtimeDistance: 10,
          slowestChainIndexingCursor: 1766123719,
          worstCaseDistance: 10,
        });
      });

      it("should return 503 when worstCaseDistance exceeds maxRealtimeDistance", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now - 11 });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxRealtimeDistance=10");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(503);
        expect(responseJson).toHaveProperty("message");
        expect(responseJson.message).toMatch(
          /Indexing Status 'worstCaseDistance' must be below or equal to the requested 'maxRealtimeDistance'; worstCaseDistance = 11; maxRealtimeDistance = 10/,
        );
      });

      it("should return 500 when indexing status has not been resolved", async () => {
        // Arrange: set `indexingStatus` context var
        indexingStatusMiddlewareMock.mockImplementation(async (c, next) => {
          c.set("indexingStatus", new Error("Network error"));

          return await next();
        });

        // Act
        const response = await app.request("http://localhost/amirealtime?maxRealtimeDistance=10");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(500);
        expect(responseJson).toHaveProperty("message");
        expect(responseJson.message).toMatch(
          /Indexing Status has to be resolved successfully before 'maxRealtimeDistance' can be applied./,
        );
      });
    });
  });
});
