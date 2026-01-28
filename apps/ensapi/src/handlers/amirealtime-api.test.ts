import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildResultOkAmIRealtime,
  ChainIndexingConfigTypeIds,
  ChainIndexingStatusIds,
  type ChainIndexingStatusSnapshotFollowing,
  type CrossChainIndexingStatusSnapshot,
  createRealtimeIndexingStatusProjection,
  ENSNamespaceIds,
  OmnichainIndexingStatusIds,
  type UnixTimestamp,
} from "@ensnode/ensnode-sdk";

import type { EnsApiConfig } from "@/config/config.schema";
import { factory } from "@/lib/hono-factory";
import * as middleware from "@/middleware/indexing-status.middleware";

import amIRealtimeApi, { AMIREALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE } from "./amirealtime-api"; // adjust import path as needed

vi.mock("@/config", () => ({
  get default() {
    const mockedConfig: Pick<EnsApiConfig, "ensIndexerUrl" | "namespace"> = {
      ensIndexerUrl: new URL("https://ensnode.example.com"),
      namespace: ENSNamespaceIds.Mainnet,
    };

    return mockedConfig;
  },
}));

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
    slowestChainIndexingCursor: UnixTimestamp;
  }) => {
    indexingStatusMiddlewareMock.mockImplementation(async (c, next) => {
      const indexingStatus = {
        omnichainSnapshot: {
          omnichainStatus: OmnichainIndexingStatusIds.Following,
          omnichainIndexingCursor: slowestChainIndexingCursor,
          chains: new Map([
            [
              1,
              {
                chainStatus: ChainIndexingStatusIds.Following,
                latestIndexedBlock: {
                  timestamp: now - 10,
                  number: 150,
                },
                latestKnownBlock: {
                  timestamp: now,
                  number: 151,
                },
                config: {
                  configType: ChainIndexingConfigTypeIds.Indefinite,
                  startBlock: {
                    number: 100,
                    timestamp: now - 1000,
                  },
                },
              } satisfies ChainIndexingStatusSnapshotFollowing,
            ],
          ]),
        } as CrossChainIndexingStatusSnapshot["omnichainSnapshot"],
        snapshotTime: now,
        slowestChainIndexingCursor,
      } satisfies Pick<
        CrossChainIndexingStatusSnapshot,
        "omnichainSnapshot" | "slowestChainIndexingCursor" | "snapshotTime"
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
      it("should accept valid requestedMaxWorstCaseDistance query param", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now - 10 });

        // Act
        const response = await app.request(
          "http://localhost/amirealtime?requestedMaxWorstCaseDistance=300",
        );
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toStrictEqual(
          buildResultOkAmIRealtime({
            requestedMaxWorstCaseDistance: 300,
            worstCaseDistance: 10,
            slowestChainIndexingCursor: now - 10,
            serverNow: now,
          }),
        );
      });

      it("should accept valid requestedMaxWorstCaseDistance query param (set to `0`)", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now });

        // Act
        const response = await app.request(
          "http://localhost/amirealtime?requestedMaxWorstCaseDistance=0",
        );
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toStrictEqual(
          buildResultOkAmIRealtime({
            requestedMaxWorstCaseDistance: 0,
            worstCaseDistance: 0,
            slowestChainIndexingCursor: now,
            serverNow: now,
          }),
        );
      });

      it("should use default requestedMaxWorstCaseDistance when unset", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now - 10 });

        // Act
        const response = await app.request(
          "http://localhost/amirealtime?requestedMaxWorstCaseDistance",
        );
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toStrictEqual(
          buildResultOkAmIRealtime({
            requestedMaxWorstCaseDistance: AMIREALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE,
            worstCaseDistance: 10,
            slowestChainIndexingCursor: now - 10,
            serverNow: now,
          }),
        );
      });

      it("should use default requestedMaxWorstCaseDistance when not provided", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now - 10 });

        // Act
        const response = await app.request("http://localhost/amirealtime");
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toStrictEqual(
          buildResultOkAmIRealtime({
            requestedMaxWorstCaseDistance: AMIREALTIME_DEFAULT_MAX_WORST_CASE_DISTANCE,
            worstCaseDistance: 10,
            slowestChainIndexingCursor: now - 10,
            serverNow: now,
          }),
        );
      });

      it("should reject invalid requestedMaxWorstCaseDistance (negative number)", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now - 10 });

        // Act
        const response = await app.request(
          "http://localhost/amirealtime?requestedMaxWorstCaseDistance=-1",
        );

        // Assert
        expect(response.status).toBe(400);
        await expect(response.text()).resolves.toMatch(
          /requestedMaxWorstCaseDistance query param must be a non-negative integer/,
        );
      });

      it("should reject invalid requestedMaxWorstCaseDistance (not a number)", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now - 10 });

        // Act
        const response = await app.request(
          "http://localhost/amirealtime?requestedMaxWorstCaseDistance=invalid",
        );

        // Assert
        expect(response.status).toBe(400);
        await expect(response.text()).resolves.toMatch(
          /requestedMaxWorstCaseDistance query param must be a number/,
        );
      });
    });

    describe("response", () => {
      it("should return 200 when worstCaseDistance is below requestedMaxWorstCaseDistance", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now - 9 });

        // Act
        const response = await app.request(
          "http://localhost/amirealtime?requestedMaxWorstCaseDistance=10",
        );
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toStrictEqual(
          buildResultOkAmIRealtime({
            requestedMaxWorstCaseDistance: 10,
            slowestChainIndexingCursor: now - 9,
            worstCaseDistance: 9,
            serverNow: now,
          }),
        );
      });

      it("should return 200 when worstCaseDistance equals requestedMaxWorstCaseDistance", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now - 10 });

        // Act
        const response = await app.request(
          "http://localhost/amirealtime?requestedMaxWorstCaseDistance=10",
        );
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseJson).toStrictEqual(
          buildResultOkAmIRealtime({
            requestedMaxWorstCaseDistance: 10,
            slowestChainIndexingCursor: 1766123719,
            worstCaseDistance: 10,
            serverNow: now,
          }),
        );
      });

      it("should return 503 when worstCaseDistance exceeds requestedMaxWorstCaseDistance", async () => {
        // Arrange: set `indexingStatus` context var
        arrangeMockedIndexingStatusMiddleware({ now, slowestChainIndexingCursor: now - 11 });

        // Act
        const response = await app.request(
          "http://localhost/amirealtime?requestedMaxWorstCaseDistance=10",
        );
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(503);
        expect(responseJson.data.errorMessage).toMatch(
          /Indexing Status 'worstCaseDistance' must be below or equal to the requested 'requestedMaxWorstCaseDistance'; worstCaseDistance = 11; requestedMaxWorstCaseDistance = 10/,
        );
      });

      it("should return 503 when indexing status has not been resolved", async () => {
        // Arrange: set `indexingStatus` context var
        indexingStatusMiddlewareMock.mockImplementation(async (c, next) => {
          c.set("indexingStatus", new Error("Network error"));

          return await next();
        });

        // Act
        const response = await app.request(
          "http://localhost/amirealtime?requestedMaxWorstCaseDistance=10",
        );
        const responseJson = await response.json();

        // Assert
        expect(response.status).toBe(503);
        expect(responseJson.data.errorMessage).toMatch(
          /This API is temporarily unavailable for this ENSNode instance. The indexing status has not been loaded by ENSApi yet./,
        );
      });
    });
  });
});
