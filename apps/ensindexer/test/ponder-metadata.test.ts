import {
  BlockRef,
  ChainIndexingBackfillStatus,
  ChainIndexingCompletedStatus,
  ChainIndexingFollowingStatus,
  ChainIndexingQueuedStatus,
  ChainIndexingStatusIds,
  ChainIndexingStrategyIds,
} from "@ensnode/ensnode-sdk";
import { describe, expect, it } from "vitest";

import {
  ChainMetadata,
  getChainIndexingStatus,
} from "@/api/lib/indexing-status/ponder-metadata/chains";
import {
  PonderConfigType,
  getChainsBlockrange,
} from "@/api/lib/indexing-status/ponder-metadata/config";

// Minimal helpers to simulate BlockRef
const blockRef = (number: number, timestamp: number = 0): BlockRef => ({ number, timestamp });

describe("getChainsBlockrange", () => {
  it("allows endBlock if all datasources for a chain define their respective endBlock", () => {
    // arrange
    const ponderConfig = {
      chains: {
        mainnet: {
          id: 1,
          rpc: "https://example.com/mainnet",
        },
      },
      accounts: {},
      contracts: {
        "subgraph/Registrar": {
          chain: {
            mainnet: { address: "0x1", startBlock: 444_444_444, endBlock: 999_999_990 },
          },
        },
        "subgraph/Registry": {
          chain: {
            mainnet: { address: "0x2", startBlock: 444_444_333, endBlock: 999_999_991 },
          },
        },
        "subgraph/UpgradableRegistry": {
          chain: {
            mainnet: { address: "0x2", startBlock: 444_555_333, endBlock: 999_999_999 },
          },
        },
      },
      blocks: {},
    } satisfies PonderConfigType;

    // act
    const result = getChainsBlockrange(ponderConfig);

    // assert
    expect(result).toStrictEqual({
      mainnet: { startBlock: 444_444_333, endBlock: 999_999_999 },
    });
  });

  it("does not allow endBlock if any datasource for a chain does not define its respective endBlock", () => {
    // arrange
    const ponderConfig = {
      chains: {
        mainnet: {
          id: 1,
          rpc: "https://example.com/mainnet",
        },
      },
      accounts: {},
      contracts: {
        "subgraph/Registrar": {
          chain: {
            mainnet: { address: "0x1", startBlock: 444_444_444, endBlock: 999_999_990 },
          },
        },
        "subgraph/Registry": {
          chain: {
            mainnet: { address: "0x2", startBlock: 444_444_333 },
          },
        },
        "subgraph/UpgradableRegistry": {
          chain: {
            mainnet: { address: "0x2", startBlock: 444_555_333, endBlock: 999_999_999 },
          },
        },
      },
      blocks: {},
    } satisfies PonderConfigType;

    // act
    const result = getChainsBlockrange(ponderConfig);

    // assert
    expect(result).toStrictEqual({
      mainnet: { startBlock: 444_444_333, endBlock: undefined },
    });
  });

  it("picks lowest startBlock and highest endBlock across all datasources for each chain", () => {
    // arrange
    const ponderConfig = {
      chains: {
        mainnet: {
          id: 1,
          rpc: "https://example.com/mainnet",
        },
      },
      accounts: {
        "vitalik.eth": { chain: "mainnet", address: "0x1", startBlock: 100, endBlock: 200 },
        "nick.eth": { chain: "mainnet", address: "0x2", startBlock: 50, endBlock: 300 },
      },
      contracts: {
        "subgraph/Registrar": {
          chain: {
            mainnet: { address: "0x1", startBlock: 444, endBlock: 999 },
          },
        },
        "subgraph/Registry": {
          chain: {
            mainnet: { address: "0x2", startBlock: 111, endBlock: 211 },
          },
        },
      },
      blocks: {
        "subgraph:InterestingBlocks": {
          chain: "mainnet",
          startBlock: 99,
          endBlock: 123,
        },
      },
    } satisfies PonderConfigType;

    // act
    const result = getChainsBlockrange(ponderConfig);

    // assert
    expect(result).toStrictEqual({
      mainnet: { startBlock: 50, endBlock: 999 },
    });
  });

  it("throws if no startBlock is defined for a chain", () => {
    // arrange
    const ponderConfig = {
      chains: {
        mainnet: {
          id: 1,
          rpc: "https://example.com/mainnet",
        },
      },
      accounts: {},
      contracts: {},
      blocks: {},
    } satisfies PonderConfigType;

    // act & assert
    expect(() => getChainsBlockrange(ponderConfig)).toThrow(
      /No minimum start block found for chain 'mainnet'/,
    );
  });

  it("handles Ponder config with flat datasources", () => {
    // arrange
    const ponderConfig = {
      chains: {
        mainnet: {
          id: 1,
          rpc: "https://example.com/mainnet",
        },
        base: {
          id: 8543,
          rpc: "https://example.com/base",
        },
      },
      accounts: {},
      contracts: {
        "subgraph/Registrar": {
          chain: "mainnet",
          address: "0x1",
          startBlock: 444_444_444,
        },
        "subgraph/Registry": {
          chain: "mainnet",
          address: "0x2",
          startBlock: 444_444_333,
        },
        "basenames/Registrar": {
          chain: "base",
          address: "0x11",
          startBlock: 1_799_433,
        },
        "basenames/Registry": {
          chain: "base",
          address: "0x12",
          startBlock: 1_799_430,
        },
      },
      blocks: {},
    } satisfies PonderConfigType;

    // act
    const result = getChainsBlockrange(ponderConfig);

    // assert
    expect(result).toStrictEqual({
      mainnet: { startBlock: 444_444_333, endBlock: undefined },
      base: { startBlock: 1_799_430, endBlock: undefined },
    });
  });

  it("handles Ponder config with nested datasources", () => {
    // arrange
    const ponderConfig = {
      chains: {
        mainnet: {
          id: 1,
          rpc: "https://example.com/mainnet",
        },
        base: {
          id: 8543,
          rpc: "https://example.com/base",
        },
      },
      accounts: {},
      contracts: {
        "subgraph/Registrar": {
          chain: {
            mainnet: { address: "0x1", startBlock: 444_444_444 },
          },
        },
        "subgraph/Registry": {
          chain: {
            mainnet: { address: "0x2", startBlock: 444_444_333 },
          },
        },
        "basenames/Registrar": {
          chain: {
            base: { address: "0x11", startBlock: 1_799_433 },
          },
        },
        "basenames/Registry": {
          chain: {
            base: { address: "0x12", startBlock: 1_799_430 },
          },
        },
      },
      blocks: {},
    } satisfies PonderConfigType;

    // act
    const result = getChainsBlockrange(ponderConfig);

    // assert
    expect(result).toStrictEqual({
      mainnet: { startBlock: 444_444_333, endBlock: undefined },
      base: { startBlock: 1_799_430, endBlock: undefined },
    });
  });

  it("handles mix of flat and nested datasources", () => {
    // arrange
    const ponderConfig = {
      chains: {
        mainnet: {
          id: 1,
          rpc: "https://example.com/mainnet",
        },
        base: {
          id: 8543,
          rpc: "https://example.com/base",
        },
      },
      accounts: {},
      contracts: {
        "subgraph/Registrar": {
          chain: {
            mainnet: { address: "0x1", startBlock: 444_444_444 },
          },
        },
        "subgraph/Registry": {
          chain: {
            mainnet: { address: "0x2", startBlock: 444_444_333 },
          },
        },
        "basenames/Registrar": {
          chain: "base",
          address: "0x11",
          startBlock: 1_799_433,
        },
        "basenames/Registry": {
          chain: "base",
          address: "0x12",
          startBlock: 1_799_430,
        },
      },
      blocks: {},
    } satisfies PonderConfigType;

    // act
    const result = getChainsBlockrange(ponderConfig);

    // assert
    expect(result).toStrictEqual({
      mainnet: { startBlock: 444_444_333, endBlock: undefined },
      base: { startBlock: 1_799_430, endBlock: undefined },
    });
  });
});

describe("getChainIndexingStatus", () => {
  it("returns 'queued' status if startBlock equals statusBlock (definite)", () => {
    // arrange
    const meta: ChainMetadata = {
      chainId: 1,
      historicalTotalBlocks: 100,
      isSyncComplete: false,
      isSyncRealtime: false,
      config: { startBlock: blockRef(10, 1000), endBlock: blockRef(20, 2000) },
      backfillEndBlock: blockRef(20, 2000),
      syncBlock: blockRef(15, 1500),
      statusBlock: blockRef(10, 1000),
    };

    // act
    const chainIndexingStatus = getChainIndexingStatus(meta, 3000);

    // assert
    expect(chainIndexingStatus).toStrictEqual({
      status: ChainIndexingStatusIds.Queued,
      config: {
        strategy: ChainIndexingStrategyIds.Definite,
        startBlock: blockRef(10, 1000),
        endBlock: blockRef(20, 2000),
      },
    } satisfies ChainIndexingQueuedStatus);
  });

  it("returns 'queued' status if startBlock equals statusBlock (indefinite)", () => {
    // arrange
    const meta: ChainMetadata = {
      chainId: 1,
      historicalTotalBlocks: 100,
      isSyncComplete: false,
      isSyncRealtime: false,
      config: { startBlock: blockRef(10, 1000), endBlock: null },
      backfillEndBlock: blockRef(20, 2000),
      syncBlock: blockRef(20, 2000),
      statusBlock: blockRef(10, 1000),
    };

    // act
    const chainIndexingStatus = getChainIndexingStatus(meta, 3000);

    // assert
    expect(chainIndexingStatus).toStrictEqual({
      status: ChainIndexingStatusIds.Queued,
      config: {
        strategy: ChainIndexingStrategyIds.Indefinite,
        startBlock: blockRef(10, 1000),
        endBlock: null,
      },
    } satisfies ChainIndexingQueuedStatus);
  });

  it("returns 'completed' status if isSyncComplete is true", () => {
    // arrange
    const meta: ChainMetadata = {
      chainId: 1,
      historicalTotalBlocks: 100,
      isSyncComplete: true,
      isSyncRealtime: false,
      config: { startBlock: blockRef(10, 1000), endBlock: blockRef(20, 2000) },
      backfillEndBlock: blockRef(20, 2000),
      syncBlock: blockRef(20, 2000),
      statusBlock: blockRef(20, 2000),
    };

    // act
    const chainIndexingStatus = getChainIndexingStatus(meta, 3000);

    // assert
    expect(chainIndexingStatus).toStrictEqual({
      status: ChainIndexingStatusIds.Completed,
      config: {
        strategy: ChainIndexingStrategyIds.Definite,
        startBlock: blockRef(10, 1000),
        endBlock: blockRef(20, 2000),
      },
      latestIndexedBlock: blockRef(20, 2000),
    } satisfies ChainIndexingCompletedStatus);
  });

  it("returns 'following' status if isSyncRealtime is true", () => {
    // arrange
    const meta: ChainMetadata = {
      chainId: 1,
      historicalTotalBlocks: 100,
      isSyncComplete: false,
      isSyncRealtime: true,
      config: { startBlock: blockRef(10, 1000), endBlock: null },
      backfillEndBlock: blockRef(20, 2000),
      syncBlock: blockRef(30, 3000),
      statusBlock: blockRef(25, 2500),
    };

    // act
    const chainIndexingStatus = getChainIndexingStatus(meta, 4000);

    // assert
    expect(chainIndexingStatus).toStrictEqual({
      status: ChainIndexingStatusIds.Following,
      config: {
        strategy: ChainIndexingStrategyIds.Indefinite,
        startBlock: blockRef(10, 1000),
      },
      latestIndexedBlock: blockRef(25, 2500),
      latestKnownBlock: blockRef(30, 3000),
      approxRealtimeDistance: 1500,
    } satisfies ChainIndexingFollowingStatus);
  });

  it("returns Backfill status otherwise (definite config)", () => {
    // arrange
    const meta: ChainMetadata = {
      chainId: 1,
      historicalTotalBlocks: 100,
      isSyncComplete: false,
      isSyncRealtime: false,
      config: { startBlock: blockRef(10, 1000), endBlock: blockRef(20, 2000) },
      backfillEndBlock: blockRef(30, 3000),
      syncBlock: blockRef(30, 3000),
      statusBlock: blockRef(15, 1500),
    };

    // act
    const chainIndexingStatus = getChainIndexingStatus(meta, 4000);

    // assert
    expect(chainIndexingStatus).toStrictEqual({
      status: ChainIndexingStatusIds.Backfill,
      config: {
        strategy: ChainIndexingStrategyIds.Definite,
        startBlock: blockRef(10, 1000),
        endBlock: blockRef(20, 2000),
      },
      latestIndexedBlock: blockRef(15, 1500),
      backfillEndBlock: blockRef(30, 3000),
    } satisfies ChainIndexingBackfillStatus);
  });

  it("returns Backfill status otherwise (indefinite config)", () => {
    // arrange
    const meta: ChainMetadata = {
      chainId: 1,
      historicalTotalBlocks: 100,
      isSyncComplete: false,
      isSyncRealtime: false,
      config: { startBlock: blockRef(10, 1000), endBlock: null },
      backfillEndBlock: blockRef(30, 3000),
      syncBlock: blockRef(30, 3000),
      statusBlock: blockRef(15, 1500),
    };

    // act
    const chainIndexingStatus = getChainIndexingStatus(meta, 4000);

    // assert
    expect(chainIndexingStatus).toStrictEqual({
      status: ChainIndexingStatusIds.Backfill,
      config: {
        strategy: ChainIndexingStrategyIds.Indefinite,
        startBlock: blockRef(10, 1000),
        endBlock: null,
      },
      latestIndexedBlock: blockRef(15, 1500),
      backfillEndBlock: blockRef(30, 3000),
    } satisfies ChainIndexingBackfillStatus);
  });
});
