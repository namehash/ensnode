import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { afterEach } from "node:test";
import {
  DEFAULT_REALTIME_INDEXING_MAX_LAG,
  type RealtimeIndexingStatusMonitoringApp,
  buildRealtimeIndexingStatusMonitoringRequest,
  getOldestLastIndexedBlockTimestamp,
  realtimeIndexingStatusMonitoringApp,
} from "@/lib/realtime-indexing-status-monitoring";
import { RealtimeIndexingStatusMonitoring } from "@ensnode/ensnode-sdk";
import { PonderStatus } from "@ensnode/ponder-metadata";
import { fromUnixTime } from "date-fns";
import { type Chain } from "viem/chains";

describe("buildRealtimeIndexingStatusMonitoringRequest", () => {
  it("can skip default values for the provided raw request properties", () => {
    const rawRequest = {
      maxAllowedIndexingLag: "98765",
    } satisfies RealtimeIndexingStatusMonitoring.RawRequest;

    const requestDefaults = {
      maxAllowedIndexingLag: 12345,
    } satisfies RealtimeIndexingStatusMonitoringApp.RequestDefaults;

    const parsedRequest = buildRealtimeIndexingStatusMonitoringRequest(rawRequest, requestDefaults);

    expect(parsedRequest).toStrictEqual({
      maxAllowedIndexingLag: 98765,
    } satisfies RealtimeIndexingStatusMonitoring.ParsedRequest);
  });

  it("can apply default values for the omitted raw request properties", () => {
    const rawRequest = {
      maxAllowedIndexingLag: undefined,
    } satisfies RealtimeIndexingStatusMonitoring.RawRequest;

    const requestDefaults = {
      maxAllowedIndexingLag: 12345,
    } satisfies RealtimeIndexingStatusMonitoringApp.RequestDefaults;

    const parsedRequest = buildRealtimeIndexingStatusMonitoringRequest(rawRequest, requestDefaults);

    expect(parsedRequest).toStrictEqual({
      maxAllowedIndexingLag: 12345,
    } satisfies RealtimeIndexingStatusMonitoring.ParsedRequest);
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

describe("realtimeIndexingStatusMonitoringApp", () => {
  const createQuery = (ponderStatus: PonderStatus) => ({
    ponderStatus() {
      return Promise.resolve(ponderStatus);
    },
  });

  const mockedLatestBlockForChain = {
    number: 17_789_321,
    timestamp: 1690520327,
  };

  let app: Hono;

  let options: RealtimeIndexingStatusMonitoringApp.Options;

  beforeEach(() => {
    // tell vitest we use mocked time
    vi.useFakeTimers();

    // create a new Hono app instance
    app = new Hono();

    // create app options
    const mockedLatestBlockForChain = {
      number: 17_789_321,
      timestamp: 1690520327,
    };

    const testChain = {
      id: 123321,
      name: "Test Chain",
    } as Chain;

    options = {
      query: createQuery(
        createPonderStatus(
          testChain,
          mockedLatestBlockForChain.number,
          mockedLatestBlockForChain.timestamp,
        ),
      ),
    };
  });

  afterEach(() => {
    // restoring date after each test run
    vi.useRealTimers();
  });

  it("returns 200 when the currentRealtimeIndexingLag does not exceed the maxAllowedIndexingLag", async () => {
    app.route("/amirealtime", realtimeIndexingStatusMonitoringApp(options));

    /**
     * Date that allows the maxAllowedIndexingLag not to be exceeded.
     */
    const mockedSystemDate = fromUnixTime(
      mockedLatestBlockForChain.timestamp + DEFAULT_REALTIME_INDEXING_MAX_LAG,
    );

    // set system time
    vi.setSystemTime(mockedSystemDate);

    const response = await app.request("/amirealtime");

    expect(response.status).toEqual(200);

    expect(await response.json()).toStrictEqual({
      currentRealtimeIndexingLag: 600,
      oldestLastIndexedBlockTimestamp: 1690520327,
      maxAllowedIndexingLag: 600,
    } satisfies RealtimeIndexingStatusMonitoring.Response);
  });

  it("returns 503 when the currentRealtimeIndexingLag exceeds the maxAllowedIndexingLag", async () => {
    app.route("/amirealtime", realtimeIndexingStatusMonitoringApp(options));

    /**
     * Date that causes the maxAllowedIndexingLag to be exceeded.
     */
    const mockedSystemDate = fromUnixTime(
      mockedLatestBlockForChain.timestamp + DEFAULT_REALTIME_INDEXING_MAX_LAG + 1,
    );

    // set system time
    vi.setSystemTime(mockedSystemDate);

    const response = await app.request("/amirealtime");

    expect(response.status).toEqual(503);

    expect(await response.json()).toStrictEqual({
      currentRealtimeIndexingLag: 601,
      oldestLastIndexedBlockTimestamp: 1690520327,
      maxAllowedIndexingLag: 600,
    } satisfies RealtimeIndexingStatusMonitoring.Response);
  });

  it("allows client's request to include a custom maxAllowedIndexingLag value", async () => {
    app.route("/amirealtime", realtimeIndexingStatusMonitoringApp(options));

    // let the client to set a custom max allowed indexing lag in seconds
    const maxAllowedIndexingLagByClient = 321;

    const response = await app.request(
      `/amirealtime?maxAllowedIndexingLag=${maxAllowedIndexingLagByClient}`,
    );
    const responseData = (await response.json()) as RealtimeIndexingStatusMonitoring.Response;

    expect(responseData.maxAllowedIndexingLag).toBe(321);
  });

  it("rejects invalid maxAllowedIndexingLag value", async () => {
    app.route("/amirealtime", realtimeIndexingStatusMonitoringApp(options));

    // let the client to set a custom max allowed indexing lag in seconds
    const maxAllowedIndexingLagByClient = -1;

    const response = await app.request(
      `/amirealtime?maxAllowedIndexingLag=${maxAllowedIndexingLagByClient}`,
    );
    const responseData = await response.text();

    expect(responseData).toBe(`Failed to parse the realtime indexing status monitoring request: 
✖ Value must be a non-negative integer.
  → at maxAllowedIndexingLag
`);
  });
});

describe("getOldestLastIndexedBlockTimestamp", () => {
  it("can select the minimal timestamp value from all provided Ponder Status objects", () => {
    const mockedLatestBlockForChain = {
      number: 17_789_321,
      timestamp: 1690520327,
    };

    const testChainA = {
      id: 123321,
      name: "Test Chain A",
    } as Chain;

    const ponderStatusA = createPonderStatus(
      testChainA,
      mockedLatestBlockForChain.number,
      mockedLatestBlockForChain.timestamp,
    );

    const testChainB = {
      id: 123322,
      name: "Test Chain B",
    } as Chain;

    const ponderStatusB = createPonderStatus(
      testChainB,
      mockedLatestBlockForChain.number - 1,
      mockedLatestBlockForChain.timestamp - 7,
    );

    const testChainC = {
      id: 123323,
      name: "Test Chain C",
    } as Chain;

    const ponderStatusC = createPonderStatus(
      testChainC,
      mockedLatestBlockForChain.number + 1,
      mockedLatestBlockForChain.timestamp + 7,
    );
    const ponderStatus = {
      ...ponderStatusA,
      ...ponderStatusB,
      ...ponderStatusC,
    };

    expect(getOldestLastIndexedBlockTimestamp(ponderStatus)).toEqual(1690520320);
  });
});
