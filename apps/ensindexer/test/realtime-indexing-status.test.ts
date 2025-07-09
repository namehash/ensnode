import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setupConfigMock } from "./utils/mockConfig";
setupConfigMock(); // setup config mock before importing dependent modules

import {
  DEFAULT_MAX_REALTIME_INDEXING_LAG,
  createRequest,
  createResponse,
  getCurrentDate,
  getRealtimeIndexingStatus,
} from "@/api/lib/realtime-indexing-status";
import { RealtimeIndexingStatusMonitoring } from "@ensnode/ensnode-sdk";
import { PonderStatus } from "@ensnode/ponder-metadata";
import { fromUnixTime, getUnixTime } from "date-fns";
import { type Chain } from "viem/chains";

describe("createRequest", () => {
  it("allows the client request to pass a custom value for maxAllowedIndexingLag param", () => {
    const request = createRequest({
      maxAllowedIndexingLag: "17",
    });
    expect(request.maxAllowedIndexingLag).toBe(17);
  });

  it("can apply a default value when the custom value maxAllowedIndexingLag param was not provided", () => {
    const request = createRequest({
      maxAllowedIndexingLag: undefined,
    });
    expect(request.maxAllowedIndexingLag).toBe(DEFAULT_MAX_REALTIME_INDEXING_LAG);
  });
});

describe("createResponse", () => {
  it("can create response object", () => {
    const oldestLastIndexedBlockDate = new Date();

    const response = createResponse({
      indexingStatus: {
        currentRealtimeIndexingLag: 123,
        hasAchievedRequestedRealtimeIndexingGap: false,
        oldestLastIndexedBlockDate: oldestLastIndexedBlockDate,
      },
      maxAllowedIndexingLag: 60,
    });

    expect(response).toStrictEqual({
      currentRealtimeIndexingLag: 123,
      maxAllowedIndexingLag: 60,
      oldestLastIndexedBlockTimestamp: getUnixTime(oldestLastIndexedBlockDate),
    } satisfies RealtimeIndexingStatusMonitoring.Response);
  });
});

describe("getCurrentDate", () => {
  // 2020-02-02
  const mockedSystemDate = new Date(2020, 1, 2);

  beforeEach(() => {
    // tell vitest we use mocked timers
    vi.useFakeTimers();

    vi.setSystemTime(mockedSystemDate);
  });

  afterEach(() => {
    // tell vitest we use real timers
    vi.useRealTimers();
  });
  it("returns the current system date", () => {
    expect(getCurrentDate()).toEqual(mockedSystemDate);
  });
});

/**
 * Helper for creating specific Ponder Status object.
 */
const createPonderStatus = (
  chain: Chain,
  blockNumber: number,
  blockTimestamp: number,
): PonderStatus =>
  ({
    [chain.name]: {
      id: chain.id,
      block: {
        number: blockNumber,
        timestamp: blockTimestamp,
      },
    },
  }) satisfies PonderStatus;

describe("getRealtimeIndexingStatus", () => {
  beforeEach(() => {
    // tell vitest we use mocked timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    // tell vitest we use real timers
    vi.useRealTimers();
  });

  it("returns the indexing status object when requested max indexing gap was not achieved", () => {
    // arrange
    const maxAllowedIndexingLag = DEFAULT_MAX_REALTIME_INDEXING_LAG;

    const mockedLatestBlockForChain = {
      number: 10_000_000,
      timestamp: 1588598533,
    };

    const currentLagMock = DEFAULT_MAX_REALTIME_INDEXING_LAG + 1;

    // set the current date to cause the requested max lag to be exceeded
    const mockedSystemDate = fromUnixTime(mockedLatestBlockForChain.timestamp + currentLagMock);
    vi.setSystemTime(mockedSystemDate);

    const currentDate = getCurrentDate();

    const testChainA = {
      id: 123321,
      name: "Test Chain A",
    } as Chain;

    const ponderStatusA = createPonderStatus(
      testChainA,
      mockedLatestBlockForChain.number + 2,
      mockedLatestBlockForChain.timestamp + 2,
    );

    const testChainB = {
      id: 123322,
      name: "Test Chain B",
    } as Chain;

    const ponderStatusB = createPonderStatus(
      testChainB,
      mockedLatestBlockForChain.number,
      mockedLatestBlockForChain.timestamp,
    );

    const testChainC = {
      id: 123323,
      name: "Test Chain C",
    } as Chain;

    const ponderStatusC = createPonderStatus(
      testChainC,
      mockedLatestBlockForChain.number + 1,
      mockedLatestBlockForChain.timestamp + 1,
    );

    const ponderStatus = {
      ...ponderStatusA,
      ...ponderStatusB,
      ...ponderStatusC,
    };

    // act
    const indexingStatus = getRealtimeIndexingStatus({
      currentDate,
      maxAllowedIndexingLag,
      ponderStatus,
    });

    // assert
    expect(indexingStatus.currentRealtimeIndexingLag).toEqual(currentLagMock);
    expect(indexingStatus.hasAchievedRequestedRealtimeIndexingGap).toBe(false);
    expect(indexingStatus.oldestLastIndexedBlockDate).toStrictEqual(
      fromUnixTime(ponderStatus[testChainB.name]!.block.timestamp),
    );
  });

  it("returns the indexing status object when requested max indexing gap has been achieved", () => {
    // arrange
    const maxAllowedIndexingLag = DEFAULT_MAX_REALTIME_INDEXING_LAG;

    const mockedLatestBlockForChain = {
      number: 10_000_000,
      timestamp: 1588598533,
    };

    const currentLagMock = DEFAULT_MAX_REALTIME_INDEXING_LAG - 1;

    // set the current date to cause the requested max lag to not be exceeded
    const mockedSystemDate = fromUnixTime(mockedLatestBlockForChain.timestamp + currentLagMock);
    vi.setSystemTime(mockedSystemDate);

    const currentDate = getCurrentDate();

    const testChainA = {
      id: 123321,
      name: "Test Chain A",
    } as Chain;

    const ponderStatusA = createPonderStatus(
      testChainA,
      mockedLatestBlockForChain.number + 2,
      mockedLatestBlockForChain.timestamp + 2,
    );

    const testChainB = {
      id: 123322,
      name: "Test Chain B",
    } as Chain;

    const ponderStatusB = createPonderStatus(
      testChainB,
      mockedLatestBlockForChain.number,
      mockedLatestBlockForChain.timestamp + 3,
    );

    const testChainC = {
      id: 123323,
      name: "Test Chain C",
    } as Chain;

    const ponderStatusC = createPonderStatus(
      testChainC,
      mockedLatestBlockForChain.number + 1,
      mockedLatestBlockForChain.timestamp,
    );

    const ponderStatus = {
      ...ponderStatusA,
      ...ponderStatusB,
      ...ponderStatusC,
    };

    // act
    const indexingStatus = getRealtimeIndexingStatus({
      currentDate,
      maxAllowedIndexingLag,
      ponderStatus,
    });

    // assert
    expect(indexingStatus.currentRealtimeIndexingLag).toEqual(currentLagMock);
    expect(indexingStatus.hasAchievedRequestedRealtimeIndexingGap).toBe(true);
    expect(indexingStatus.oldestLastIndexedBlockDate).toStrictEqual(
      fromUnixTime(ponderStatus[testChainC.name]!.block.timestamp),
    );
  });
});
