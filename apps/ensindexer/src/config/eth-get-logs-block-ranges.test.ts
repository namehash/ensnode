import { describe, expect, it } from "vitest";

import {
  buildEthGetLogsBlockRangesFromEnv,
  EthGetLogsBlockRangesSchema,
} from "./eth-get-logs-block-ranges";

describe("buildEthGetLogsBlockRangesFromEnv", () => {
  it("returns an empty record when no ETH_GET_LOGS_BLOCK_RANGE_* vars are set", () => {
    expect(buildEthGetLogsBlockRangesFromEnv({}, "mainnet")).toStrictEqual({});
  });

  it("collects ETH_GET_LOGS_BLOCK_RANGE_<chainId> for chains in the namespace", () => {
    expect(
      buildEthGetLogsBlockRangesFromEnv({ ETH_GET_LOGS_BLOCK_RANGE_1: "1000" }, "mainnet"),
    ).toStrictEqual({ "1": "1000" });
  });

  it("ignores ETH_GET_LOGS_BLOCK_RANGE_<chainId> for chains outside the namespace", () => {
    expect(
      buildEthGetLogsBlockRangesFromEnv({ ETH_GET_LOGS_BLOCK_RANGE_999999: "1000" }, "mainnet"),
    ).toStrictEqual({});
  });
});

describe("EthGetLogsBlockRangesSchema", () => {
  it("parses an empty record to an empty Map", () => {
    expect(EthGetLogsBlockRangesSchema.parse({})).toStrictEqual(new Map());
  });

  it("parses chain-id strings to numeric block ranges", () => {
    expect(EthGetLogsBlockRangesSchema.parse({ "1": "1000", "8453": "500" })).toStrictEqual(
      new Map([
        [1, 1000],
        [8453, 500],
      ]),
    );
  });

  it.each(["abc", "0", "-5", "1.5"])("rejects invalid block range %j", (value) => {
    expect(() => EthGetLogsBlockRangesSchema.parse({ "1": value })).toThrow();
  });
});
