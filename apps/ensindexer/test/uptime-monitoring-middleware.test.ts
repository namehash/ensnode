import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { afterEach } from "node:test";
import {
  type UptimeMonitoring,
  buildUptimeMonitoringRequest,
  getLowestLastIndexedBlockTimestamp,
  uptimeMonitoring,
} from "@/lib/uptime-monitoring-middleware";
import { PonderStatus } from "@ensnode/ponder-metadata";
import { fromUnixTime } from "date-fns";
import { http, Chain, PublicClient, createPublicClient } from "viem";
import { base, linea, mainnet } from "viem/chains";

describe("buildUptimeMonitoringRequest", () => {
  it("can skip default values for the provided raw request properties", () => {
    const rawRequest = {
      gapThreshold: "98765",
    } satisfies UptimeMonitoring.RawRequest;

    const requestDefaults = {
      gapThreshold: 12345,
    } satisfies UptimeMonitoring.RequestDefaults;

    const parsedRequest = buildUptimeMonitoringRequest(rawRequest, requestDefaults);

    expect(parsedRequest).toStrictEqual({
      gapThreshold: 98765,
    } satisfies UptimeMonitoring.ParsedRequest);
  });

  it("can apply default values for the omitted raw request properties", () => {
    const rawRequest = {
      gapThreshold: undefined,
    } satisfies UptimeMonitoring.RawRequest;

    const requestDefaults = {
      gapThreshold: 12345,
    } satisfies UptimeMonitoring.RequestDefaults;

    const parsedRequest = buildUptimeMonitoringRequest(rawRequest, requestDefaults);

    expect(parsedRequest).toStrictEqual({
      gapThreshold: 12345,
    } satisfies UptimeMonitoring.ParsedRequest);
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

describe("uptimeMonitoring middleware", () => {
  const createPublicClients = (chain: Chain) => ({
    [chain.name]: createPublicClient({
      transport: http(),
      chain,
    }),
  });

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

  let middlewareOptions: UptimeMonitoring.MiddlewareOptions;

  beforeEach(() => {
    // tell vitest we use mocked time
    vi.useFakeTimers();

    // create a new Hono app instance
    app = new Hono();

    // create middleware options
    const chain = mainnet;
    const mockedLatestBlockForChain = {
      number: 17_789_321,
      timestamp: 1690520327,
    };

    middlewareOptions = {
      query: createQuery(
        createPonderStatus(
          chain,
          mockedLatestBlockForChain.number,
          mockedLatestBlockForChain.timestamp,
        ),
      ),
      publicClients: createPublicClients(chain),
      // let the server to set the default allowed gap threshold in seconds
      realtimeIndexingGapThreshold: 12345,
    };
  });

  afterEach(() => {
    // restoring date after each test run
    vi.useRealTimers();
  });

  it("returns 200 when the currentRealtimeIndexingGap does not exceed the realtimeIndexingGapThreshold", async () => {
    app.get("/amirealtime", uptimeMonitoring(middlewareOptions));

    /**
     * Date that allows the realtimeIndexingGapThreshold not to be exceeded.
     */
    const mockedSystemDate = fromUnixTime(
      mockedLatestBlockForChain.timestamp + middlewareOptions.realtimeIndexingGapThreshold,
    );

    // set system time
    vi.setSystemTime(mockedSystemDate);

    const response = await app.request("/amirealtime");

    expect(response.status).toEqual(200);

    expect(await response.json()).toStrictEqual({
      currentRealtimeIndexingGap: 12345,
      lowestLastIndexedBlockTimestamp: 1690520327,
      realtimeIndexingGapThreshold: 12345,
    });
  });

  it("returns 503 when the currentRealtimeIndexingGap exceeds the realtimeIndexingGapThreshold", async () => {
    app.get("/amirealtime", uptimeMonitoring(middlewareOptions));

    /**
     * Date that causes the realtimeIndexingGapThreshold to be exceeded.
     */
    const mockedSystemDate = fromUnixTime(
      mockedLatestBlockForChain.timestamp + middlewareOptions.realtimeIndexingGapThreshold + 1,
    );

    // set system time
    vi.setSystemTime(mockedSystemDate);

    const response = await app.request("/amirealtime");

    expect(response.status).toEqual(503);

    expect(await response.json()).toStrictEqual({
      currentRealtimeIndexingGap: 12346,
      lowestLastIndexedBlockTimestamp: 1690520327,
      realtimeIndexingGapThreshold: 12345,
    });
  });

  it("allows the client request to include the custom gap threshold", async () => {
    app.get("/amirealtime", uptimeMonitoring(middlewareOptions));

    // let the client to set a custom allowed gap threshold in seconds
    const realtimeIndexingGapThresholdByClient = 321;

    const response = await app.request(
      `/amirealtime?gapThreshold=${realtimeIndexingGapThresholdByClient}`,
    );
    const responseData = await response.json();

    expect(responseData.realtimeIndexingGapThreshold).toBe(321);
  });

  it("rejects the invalid custom gap threshold", async () => {
    app.get("/amirealtime", uptimeMonitoring(middlewareOptions));

    // let the client to set a custom allowed gap threshold in seconds
    const realtimeIndexingGapThresholdByClient = -1;

    const response = await app.request(
      `/amirealtime?gapThreshold=${realtimeIndexingGapThresholdByClient}`,
    );
    const responseData = await response.text();

    expect(responseData).toBe(`Failed to parse the uptime monitoring request: 
✖ \"gapThreshold\" must be a positive integer.
  → at gapThreshold
`);
  });
});

describe("getLowestLastIndexedBlockTimestamp", () => {
  it("can select the minimal timestamp value from all provided Ponder Status objects", () => {
    const mockedLatestBlockForChain = {
      number: 17_789_321,
      timestamp: 1690520327,
    };
    const ponderStatusMainnet = createPonderStatus(
      mainnet,
      mockedLatestBlockForChain.number,
      mockedLatestBlockForChain.timestamp,
    );
    const ponderStatusBase = createPonderStatus(
      base,
      mockedLatestBlockForChain.number - 1,
      mockedLatestBlockForChain.timestamp - 7,
    );
    const ponderStatusLinea = createPonderStatus(
      linea,
      mockedLatestBlockForChain.number + 1,
      mockedLatestBlockForChain.timestamp + 7,
    );
    const ponderStatus = {
      ...ponderStatusMainnet,
      ...ponderStatusBase,
      ...ponderStatusLinea,
    };

    expect(
      getLowestLastIndexedBlockTimestamp([mainnet.id, base.id, linea.id], ponderStatus),
    ).toEqual(1690520320);
  });
});
