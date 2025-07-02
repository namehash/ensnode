import { PluginName } from "@ensnode/ensnode-sdk";
import { fromUnixTime } from "date-fns";
import { base, mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";
import {
  type ChainStatusViewModel,
  type GlobalIndexingStatusViewModel,
  blockViewModel,
  chainIndexingStatusViewModel,
  ensNodeDepsViewModel,
  ensNodeEnvViewModel,
  globalIndexingStatusViewModel,
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
        PLUGINS: [PluginName.Subgraph],
        DATABASE_SCHEMA: "public",
        NAMESPACE: "ens-test-env",
      });

      expect(result).toEqual([
        { label: "Active Plugins", value: [PluginName.Subgraph] },
        { label: "ENS Namespace", value: "ens-test-env" },
        { label: "Database Schema", value: "public" },
      ]);
    });
  });

  describe("globalIndexingStatusViewModel", () => {
    it("should return the correct view model", () => {
      const ensNodeChainStatus = testEnsNodeChainStatus();

      const mainnetStatus = ensNodeChainStatus[mainnet.id];
      const baseStatus = ensNodeChainStatus[base.id];

      expect(globalIndexingStatusViewModel(ensNodeChainStatus, "mainnet")).toEqual({
        chainStatuses: [
          {
            chainId: 1,
            chainName: "Ethereum",
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
            blockExplorerURL: "https://etherscan.io",
          },
          {
            chainId: 8453,
            chainName: "Base",
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
            blockExplorerURL: "https://basescan.org",
          },
        ],
        currentIndexingDate: fromUnixTime(mainnetStatus.lastIndexedBlock.timestamp),
        indexingStartsAt: fromUnixTime(mainnetStatus.firstBlockToIndex.timestamp),
      } satisfies GlobalIndexingStatusViewModel);
    });
  });

  describe("chainIndexingStatusViewModel", () => {
    it("should return the correct view model without block explorer", () => {
      expect(
        chainIndexingStatusViewModel(
          `${base.name}`,
          {
            chainId: base.id,
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
        chainId: 8453,
        chainName: "Base",
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
      } satisfies ChainStatusViewModel);
    });

    it("should return the correct view model with block explorer", () => {
      expect(
        chainIndexingStatusViewModel(
          base.id,
          `${base.name}`,
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
          "https://basescan.org",
        ),
      ).toEqual({
        chainId: 8453,
        chainName: "Base",
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
        blockExplorerURL: "https://basescan.org",
      } satisfies ChainStatusViewModel);
    });
  });
});

function testEnsNodeChainStatus() {
  return {
    [mainnet.id]: {
      chainId: mainnet.id,
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
      chainId: base.id,
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
