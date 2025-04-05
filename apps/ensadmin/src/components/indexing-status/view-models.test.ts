import { fromUnixTime } from "date-fns";
import { base, mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";
import {
  type GlobalIndexingStatusViewModel,
  type NetworkStatusViewModel,
  blockViewModel,
  ensNodeDepsViewModel,
  ensNodeEnvViewModel,
  globalIndexingStatusViewModel,
  networkIndexingStatusViewModel,
} from "./view-models";

describe("View Models", () => {
  describe("ensNodeDepsViewModel", () => {
    it("should return the correct view model", () => {
      const result = ensNodeDepsViewModel({
        nodejs: "v22.14.0",
        ponder: "v0.9.9",
      });

      expect(result).toEqual([
        { label: "Ponder", value: "v0.9.9" },
        { label: "Node.js", value: "v22.14.0" },
      ]);
    });
  });

  describe("ensNodeEnvViewModel", () => {
    it("should return the correct view model", () => {
      const result = ensNodeEnvViewModel({
        ACTIVE_PLUGINS: ["eth"],
        DATABASE_SCHEMA: "public",
        ENS_DEPLOYMENT_CHAIN: "ens-test-env",
      });

      expect(result).toEqual([
        { label: "Active Plugins", value: ["eth"] },
        { label: "ENS Deployment Chain", value: "ens-test-env" },
        { label: "Database Schema", value: "public" },
      ]);
    });
  });

  describe("globalIndexingStatusViewModel", () => {
    it("should return the correct view model", () => {
      const ensNodeNetworkStatus = testEnsNodeNetworkStatus();

      const mainnetStatus = ensNodeNetworkStatus[mainnet.id];
      const baseStatus = ensNodeNetworkStatus[base.id];

      expect(globalIndexingStatusViewModel(ensNodeNetworkStatus)).toEqual({
        networkStatuses: [
          {
            name: "Ethereum",
            latestSafeBlock: blockViewModel(mainnetStatus.latestSafeBlock),
            firstBlockToIndex: blockViewModel(mainnetStatus.firstBlockToIndex),
            lastIndexedBlock: blockViewModel(mainnetStatus.lastIndexedBlock),
            lastSyncedBlock: blockViewModel(mainnetStatus.lastSyncedBlock),
            phases: [
              {
                state: "indexing",
                startDate: fromUnixTime(mainnetStatus.firstBlockToIndex.timestamp),
                endDate: fromUnixTime(mainnetStatus.latestSafeBlock.timestamp),
              },
            ],
          },
          {
            name: "Base",
            latestSafeBlock: blockViewModel(baseStatus.latestSafeBlock),
            firstBlockToIndex: blockViewModel(baseStatus.firstBlockToIndex),
            lastIndexedBlock: null,
            lastSyncedBlock: blockViewModel(baseStatus.lastSyncedBlock),
            phases: [
              {
                state: "queued",
                startDate: fromUnixTime(mainnetStatus.firstBlockToIndex.timestamp),
                endDate: fromUnixTime(baseStatus.firstBlockToIndex.timestamp),
              },
              {
                state: "indexing",
                startDate: fromUnixTime(baseStatus.firstBlockToIndex.timestamp),
                endDate: fromUnixTime(baseStatus.latestSafeBlock.timestamp),
              },
            ],
          },
        ],
        currentIndexingDate: fromUnixTime(mainnetStatus.lastIndexedBlock.timestamp),
        indexingStartsAt: fromUnixTime(mainnetStatus.firstBlockToIndex.timestamp),
      } satisfies GlobalIndexingStatusViewModel);
    });
  });

  describe("networkIndexingStatusViewModel", () => {
    it("should return the correct view model", () => {
      expect(
        networkIndexingStatusViewModel(
          `${base.id}`,
          {
            latestSafeBlock: {
              number: 333,
              timestamp: 1501,
            },
            firstBlockToIndex: {
              number: 222,
              timestamp: 1111,
            },
            lastIndexedBlock: null,
            lastSyncedBlock: {
              number: 272,
              timestamp: 1247,
            },
          },
          1000,
        ),
      ).toEqual({
        name: "Base",
        latestSafeBlock: {
          number: 333,
          timestamp: 1501,
          get date() {
            return fromUnixTime(1501);
          },
        },
        firstBlockToIndex: {
          number: 222,
          timestamp: 1111,
          get date() {
            return fromUnixTime(1111);
          },
        },
        lastIndexedBlock: null,
        lastSyncedBlock: {
          number: 272,
          timestamp: 1247,
          get date() {
            return fromUnixTime(1247);
          },
        },
        phases: [
          {
            state: "queued",
            startDate: fromUnixTime(1000),
            endDate: fromUnixTime(1111),
          },
          {
            state: "indexing",
            startDate: fromUnixTime(1111),
            endDate: fromUnixTime(1501),
          },
        ],
      } satisfies NetworkStatusViewModel);
    });
  });
});

function testEnsNodeNetworkStatus() {
  return {
    [mainnet.id]: {
      firstBlockToIndex: {
        number: 17,
        timestamp: 1000,
      },
      lastIndexedBlock: {
        number: 28,
        timestamp: 1100,
      },
      lastSyncedBlock: {
        number: 46,
        timestamp: 1250,
      },
      latestSafeBlock: {
        number: 87,
        timestamp: 1500,
      },
    },

    [base.id]: {
      firstBlockToIndex: {
        number: 222,
        timestamp: 1111,
      },
      lastIndexedBlock: null,
      lastSyncedBlock: {
        number: 272,
        timestamp: 1247,
      },
      latestSafeBlock: {
        number: 333,
        timestamp: 1501,
      },
    },
  } as const;
}
