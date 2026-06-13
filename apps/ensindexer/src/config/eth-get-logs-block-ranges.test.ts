import { describe, expect, it } from "vitest";

import {
  buildEthGetLogsBlockRangesFromEnv,
  EthGetLogsBlockRangesSchema,
} from "./eth-get-logs-block-ranges";

describe("buildEthGetLogsBlockRangesFromEnv", () => {
  it("returns an empty record when no ETH_GET_LOGS_BLOCK_RANGE or ETH_GET_LOGS_BLOCK_RANGE_<chainId> vars are set", () => {
    expect(buildEthGetLogsBlockRangesFromEnv({}, "mainnet")).toStrictEqual({});
  });

  it("collects ETH_GET_LOGS_BLOCK_RANGE_<chainId> for chains in the namespace", () => {
    expect(
      buildEthGetLogsBlockRangesFromEnv({ ETH_GET_LOGS_BLOCK_RANGE_1: "1000" }, "mainnet"),
    ).toStrictEqual({ "1": "1000" });
  });

  it("applies the global ETH_GET_LOGS_BLOCK_RANGE default to every chain in the namespace", () => {
    expect(
      buildEthGetLogsBlockRangesFromEnv({ ETH_GET_LOGS_BLOCK_RANGE: "1000" }, "mainnet"),
    ).toMatchObject({ "1": "1000", "8453": "1000" });
  });

  it("lets a chain-specific value override the global default", () => {
    expect(
      buildEthGetLogsBlockRangesFromEnv(
        { ETH_GET_LOGS_BLOCK_RANGE: "1000", ETH_GET_LOGS_BLOCK_RANGE_8453: "500" },
        "mainnet",
      ),
    ).toMatchObject({ "1": "1000", "8453": "500" });
  });

  it("lets a chain-specific 0 take precedence over the global default", () => {
    expect(
      buildEthGetLogsBlockRangesFromEnv(
        { ETH_GET_LOGS_BLOCK_RANGE: "1000", ETH_GET_LOGS_BLOCK_RANGE_1: "0" },
        "mainnet",
      ),
    ).toMatchObject({ "1": "0", "8453": "1000" });
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

  it("treats 0 as a disable sentinel and omits that chain", () => {
    expect(EthGetLogsBlockRangesSchema.parse({ "1": "0", "8453": "1000" })).toStrictEqual(
      new Map([[8453, 1000]]),
    );
  });

  it.each(["abc", "-5", "1.5"])("rejects invalid block range %j", (value) => {
    expect(() => EthGetLogsBlockRangesSchema.parse({ "1": value })).toThrow();
  });
});
